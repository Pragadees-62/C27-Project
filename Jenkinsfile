pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'eduprime-sms'
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
                sh 'docker-compose build'
                echo '✅ Docker images built.'
            }
        }

        stage('Deploy Containers') {
            steps {
                sh 'docker-compose down --remove-orphans'
                // Stop any container holding port 3000 or 80
                sh 'docker ps -q | xargs -r docker stop || true'
                sh 'docker ps -aq | xargs -r docker rm -f || true'
                sh 'fuser -k 3000/tcp || true'
                sh 'fuser -k 80/tcp || true'
                sh 'sleep 3'
                sh 'docker-compose up -d'
                echo '✅ Containers started.'
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    echo "Waiting for backend to be ready..."
                    sleep 15
                    echo "--- Backend logs ---"
                    docker logs sms-backend --tail 30 || true
                    echo "--- Health check ---"
                    curl -sf http://localhost:3000/health \
                        && echo "✅ Backend is healthy." \
                        || { echo "❌ Health check failed — check backend logs above."; exit 1; }
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
            sh 'docker-compose down || true'
        }
        always {
            sh 'docker image prune -f || true'
            echo "Pipeline finished — ${currentBuild.currentResult}"
        }
    }
}
