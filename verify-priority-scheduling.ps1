# Integration Test for Prioritized Study Planner Scheduling Algorithm

try {
    # 1. Log in to get accessToken
    Write-Host "Logging in as john_doe..." -ForegroundColor Cyan
    $login = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method Post -Body '{"username":"john_doe","password":"password123"}' -ContentType 'application/json'
    $headers = @{ 'Authorization' = "Bearer $($login.accessToken)" }
    Write-Host "Login successful!" -ForegroundColor Green

    # 2. Clean up existing subjects
    Write-Host "Fetching existing subjects to clean up..." -ForegroundColor Cyan
    $existingSubjects = Invoke-RestMethod -Uri 'http://localhost:8080/api/subjects' -Method Get -Headers $headers
    foreach ($sub in $existingSubjects) {
        Write-Host "Deleting old subject: $($sub.name) (ID: $($sub.id))..."
        try {
            Invoke-RestMethod -Uri "http://localhost:8080/api/subjects/$($sub.id)" -Method Delete -Headers $headers
        } catch {
            Write-Host "Failed to delete subject $($sub.id): $_" -ForegroundColor Yellow
        }
    }

    # 3. Create Easy, Medium, and Hard subjects
    Write-Host "Creating Easy, Medium, and Hard subjects..." -ForegroundColor Cyan
    
    # Hard Subject
    $mathBody = @{
        name = "Math"
        difficulty = "HARD"
        color = "#ef4444" # red
        studyDurationMinutes = 60
    } | ConvertTo-Json
    $math = Invoke-RestMethod -Uri 'http://localhost:8080/api/subjects' -Method Post -Headers $headers -Body $mathBody -ContentType 'application/json'
    Write-Host "Created 'Math' (HARD) - ID: $($math.id)" -ForegroundColor Green

    # Medium Subject
    $physicsBody = @{
        name = "Physics"
        difficulty = "MEDIUM"
        color = "#eab308" # yellow
        studyDurationMinutes = 60
    } | ConvertTo-Json
    $physics = Invoke-RestMethod -Uri 'http://localhost:8080/api/subjects' -Method Post -Headers $headers -Body $physicsBody -ContentType 'application/json'
    Write-Host "Created 'Physics' (MEDIUM) - ID: $($physics.id)" -ForegroundColor Green

    # Easy Subject
    $historyBody = @{
        name = "History"
        difficulty = "EASY"
        color = "#3b82f6" # blue
        studyDurationMinutes = 60
    } | ConvertTo-Json
    $history = Invoke-RestMethod -Uri 'http://localhost:8080/api/subjects' -Method Post -Headers $headers -Body $historyBody -ContentType 'application/json'
    Write-Host "Created 'History' (EASY) - ID: $($history.id)" -ForegroundColor Green

    # 4. Generate 7-day schedule (4 hours per day = 28 slots total)
    $startDate = "2026-06-01"
    $endDate = "2026-06-07"
    Write-Host "Generating a 7-day plan from $startDate to $endDate (4 hours daily)..." -ForegroundColor Cyan
    $genBody = @{
        startDate = $startDate
        endDate = $endDate
        dailyStudyHours = 4.0
        distributeEqually = $false
    } | ConvertTo-Json
    $slots = Invoke-RestMethod -Uri 'http://localhost:8080/api/planner/generate' -Method Post -Headers $headers -Body $genBody -ContentType 'application/json'
    Write-Host "Generated $($slots.Count) slots!" -ForegroundColor Green

    # Count slots per subject
    $counts = @{ "Math" = 0; "Physics" = 0; "History" = 0 }
    foreach ($slot in $slots) {
        Write-Host "  [Slot] Date: $($slot.planDate) | Time: $($slot.startTime.SubString(0,5)) - $($slot.endTime.SubString(0,5)) | Subject: $($slot.subject.name)" -ForegroundColor DarkGray
        $counts[$slot.subject.name]++
    }

    Write-Host "`n=== Slot Distribution by Difficulty ===" -ForegroundColor Yellow
    Write-Host "Math (HARD)    : $($counts['Math']) hours" -ForegroundColor Red
    Write-Host "Physics (MEDIUM): $($counts['Physics']) hours" -ForegroundColor Yellow
    Write-Host "History (EASY)  : $($counts['History']) hours" -ForegroundColor Blue

    # Verify order: HARD > MEDIUM > EASY
    if ($counts['Math'] -gt $counts['Physics'] -and $counts['Physics'] -gt $counts['History']) {
        Write-Host "SUCCESS: Slot distribution matches difficulty priorities (HARD > MEDIUM > EASY)!" -ForegroundColor Green
    } else {
        Write-Warning "WARNING: Slot distribution does not strictly match priorities. (Expected HARD > MEDIUM > EASY)"
    }

    # 5. Test Exam Urgency shift
    # Create an exam for History (EASY) on 2026-06-02 (day 2 of the range)
    Write-Host "`nAdding an upcoming exam for 'History' (EASY) on 2026-06-02..." -ForegroundColor Cyan
    $examBody = @{
        title = "History Midterm"
        examDate = "2026-06-02T09:00:00"
        subjectId = $history.id
    } | ConvertTo-Json
    $exam = Invoke-RestMethod -Uri 'http://localhost:8080/api/subjects/exams' -Method Post -Headers $headers -Body $examBody -ContentType 'application/json'
    Write-Host "Created Exam: $($exam.title) (ID: $($exam.id))" -ForegroundColor Green

    # Regenerate schedule
    Write-Host "Regenerating schedule to test exam urgency shift..." -ForegroundColor Cyan
    $slots2 = Invoke-RestMethod -Uri 'http://localhost:8080/api/planner/generate' -Method Post -Headers $headers -Body $genBody -ContentType 'application/json'

    $counts2 = @{ "Math" = 0; "Physics" = 0; "History" = 0 }
    foreach ($slot in $slots2) {
        Write-Host "  [Slot] Date: $($slot.planDate) | Time: $($slot.startTime.SubString(0,5)) - $($slot.endTime.SubString(0,5)) | Subject: $($slot.subject.name)" -ForegroundColor Gray
        $counts2[$slot.subject.name]++
    }

    Write-Host "`n=== Slot Distribution after History Exam Added ===" -ForegroundColor Yellow
    Write-Host "Math (HARD)    : $($counts2['Math']) hours" -ForegroundColor Red
    Write-Host "Physics (MEDIUM): $($counts2['Physics']) hours" -ForegroundColor Yellow
    Write-Host "History (EASY)  : $($counts2['History']) hours" -ForegroundColor Blue

    # Verify that History got a significant boost on or before the exam date (2026-06-02)
    $historyBeforeExam1 = @($slots | Where-Object { $_.subject.name -eq "History" -and $_.planDate -le "2026-06-02" }).Count
    $historyBeforeExam2 = @($slots2 | Where-Object { $_.subject.name -eq "History" -and $_.planDate -le "2026-06-02" }).Count

    Write-Host "`nHistory hours on/before exam date (2026-06-02):" -ForegroundColor Cyan
    Write-Host "  Before adding exam: $historyBeforeExam1 hours"
    Write-Host "  After adding exam : $historyBeforeExam2 hours"

    if ($historyBeforeExam2 -gt $historyBeforeExam1) {
        Write-Host "SUCCESS: History (EASY) received a study slot boost before its exam (from $historyBeforeExam1 to $historyBeforeExam2 hours)!" -ForegroundColor Green
    } else {
        Write-Warning "WARNING: History did not receive a study slot boost before its exam."
    }

} catch {
    Write-Error $_
}
