#!/usr/bin/env bash
set -e
# Build the backend jar
mvn -f backend/pom.xml clean package -DskipTests
