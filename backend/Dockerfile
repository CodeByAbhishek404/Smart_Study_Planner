# Use official Maven/Java 17 image to build the app
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy the pom.xml and source code
COPY pom.xml .
COPY src ./src

# Build the application (skipping tests for faster deployment)
RUN mvn clean package -DskipTests

# Use a lightweight JRE image to run the app
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy the built JAR file from the build stage
COPY --from=build /app/target/smart-study-planner-0.0.1-SNAPSHOT.jar app.jar

# Expose the port the app runs on
EXPOSE 8080

# Run the jar
ENTRYPOINT ["java", "-jar", "app.jar"]
