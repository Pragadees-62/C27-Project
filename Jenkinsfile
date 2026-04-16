pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'student-management-system'
    }

    stages {
        stage('Clone Repository') {
            steps {
                checkout scm
                echo 'Repository cloned successfully.'
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker-compose build'
            }
        }

        stage('Run Containers') {
            steps {
                sh 'docker-compose down'
                sh 'docker-compose up -d'
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution complete.'
        }
        success {
            echo 'Deployment Successful! System is up and running at http://localhost'
        }
        failure {
            echo 'Deployment Failed. Check logs for details.'
        }
    }
}
