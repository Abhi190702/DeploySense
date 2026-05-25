FROM openjdk:latest
COPY . .
RUN ./gradlew build
CMD ["java", "-jar", "build/libs/app.jar"]
