# Backend Dockerfile
# Build stage using Maven and Java 17
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY backend/pom.xml ./
COPY backend/src ./src
RUN mvn -B -DskipTests clean package

# Runtime stage using lightweight JRE
FROM eclipse-temurin:17-jre-alpine
RUN apk --no-cache add curl
WORKDIR /app
COPY --from=build /app/target/voltflow-backend-0.0.1-SNAPSHOT.jar app.jar
RUN addgroup -S spring && adduser -S spring -G spring && chown spring:spring /app/app.jar
USER spring:spring
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
