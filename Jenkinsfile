pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'eduprime-sms'
        DOCKER_BUILDKIT      = '1'
    }

    triggers {
        githubPush()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "✅ Code checked out — Branch: ${env.GIT_BRANCH}, Commit: ${env.GIT_COMMIT?.take(7)}"
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker compose build --no-cache'
                echo '✅ Docker images built.'
            }
        }

        stage('Deploy Containers') {
            steps {
                sh 'docker compose down --remove-orphans'
                sh 'docker compose up -d'
                echo '✅ Containers started.'
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    echo "Waiting for backend to be ready..."
                    sleep 15
                    curl -sf http://localhost:3000/api/teachers \
                        && echo "✅ Backend is healthy." \
                        || (echo "❌ Health check failed" && exit 1)
                '''
            }
        }

    }

    post {
        success {
            echo '🚀 Deployment successful! EduPrime SMS is live.'
        }
        failure {
            echo '❌ Pipeline failed. Check the logs above.'
            sh 'docker compose down || true'
        }
        always {
            sh 'docker image prune -f || true'
            echo "Pipeline finished — ${currentBuild.currentResult}"
        }
    }
}
