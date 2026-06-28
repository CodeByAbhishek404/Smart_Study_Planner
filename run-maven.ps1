param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$MavenArgs
)

# Auto-detect and correct JAVA_HOME if invalid or empty
if (-not $env:JAVA_HOME -or -not (Test-Path $env:JAVA_HOME)) {
    Write-Host "Checking JAVA_HOME: Current value '$env:JAVA_HOME' is invalid or not set."
    $JavaSearchPaths = @(
        "C:\Program Files\Java\jdk-24",
        "C:\Program Files\Java\jdk-21",
        "C:\Program Files\Java\jdk-17",
        "C:\Program Files\Java\jdk-11"
    )
    
    # Check if there are any JDK installations in Program Files
    if (Test-Path "C:\Program Files\Java") {
        $InstalledJdks = Get-ChildItem "C:\Program Files\Java" | Where-Object { $_.PSIsContainer -and $_.Name -like "jdk*" }
        foreach ($jdk in $InstalledJdks) {
            $JavaSearchPaths += $jdk.FullName
        }
    }

    $FoundJavaHome = $null
    foreach ($path in $JavaSearchPaths) {
        if (Test-Path $path) {
            $FoundJavaHome = $path
            break
        }
    }

    if ($FoundJavaHome) {
        $env:JAVA_HOME = $FoundJavaHome
        $env:Path = "$(Join-Path $FoundJavaHome 'bin');$env:Path"
        Write-Host "Temporarily set JAVA_HOME to '$env:JAVA_HOME' for this session."
    } else {
        Write-Warning "Could not find a valid JDK installation. Maven compilation might fail."
    }
}

$MavenDir = Join-Path $PSScriptRoot ".maven"
$MavenZip = Join-Path $PSScriptRoot "maven.zip"
$MavenDest = Join-Path $MavenDir "apache-maven-3.9.6"
$MvnExe = Join-Path $MavenDest "bin\mvn.cmd"

if (-not (Test-Path $MvnExe)) {
    Write-Host "Local Maven not found. Initializing setup..."
    if (-not (Test-Path $MavenDir)) {
        New-Item -ItemType Directory -Force -Path $MavenDir | Out-Null
    }
    
    $Url = "https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip"
    Write-Host "Downloading Maven from $Url..."
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $Url -OutFile $MavenZip -UseBasicParsing
        Write-Host "Extracting files to $MavenDir..."
        Expand-Archive -Path $MavenZip -DestinationPath $MavenDir -Force
        Remove-Item $MavenZip -Force
        Write-Host "Local Maven setup complete at $MavenDest!"
    } catch {
        Write-Error "Failed to download or install Maven. Please check your internet connection or install Maven manually. Error: $_"
        exit 1
    }
}

# Run Maven with all passed arguments and tee output to backend-run.log without PowerShell error wrapper
$argsString = $MavenArgs -join ' '
cmd.exe /c "`"$MvnExe`" $argsString 2>&1" | Tee-Object -FilePath "backend-run.log"



