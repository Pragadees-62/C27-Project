pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'student-management-system'
    }

    stages {
        stage('Clone Repository') {
            steps {
                // In a real scenario, this would be:
                // git 'https://github.com/your-repo/student-management-system.git'
                echo 'Skipping clone for local Jenkins execution, using workspace files.'
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
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
