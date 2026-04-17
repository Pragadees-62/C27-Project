pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'eduprime-sms'
        DOCKER_BUILDKIT      = '1'
    }

    triggers {
        // GitHub webhook triggers this automatically on every push
        githubPush()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "✅ Code checked out — Branch: ${env.GIT_BRANCH}, Commit: ${env.GIT_COMMIT?.take(7)}"
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm ci --prefer-offline || npm install'
                    echo '✅ Backend dependencies installed.'
                }
            }
        }

        stage('Lint & Validate') {
            steps {
                dir('backend') {
                    // Basic syntax check on all JS files
                    sh 'node --check server.js'
                    sh 'node --check controllers/apiController.js'
                    sh 'node --check routes/apiRoutes.js'
                    sh 'node --check models/index.js'
                    sh 'node --check config/db.js'
                    echo '✅ Syntax validation passed.'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker-compose build --no-cache'
                echo '✅ Docker images built.'
            }
        }

        stage('Deploy Containers') {
            steps {
                sh 'docker-compose down --remove-orphans'
                sh 'docker-compose up -d'
                echo '✅ Containers started.'
            }
        }

        stage('Health Check') {
            steps {
                // Wait for backend to be ready then hit the API
                sh '''
                    echo "Waiting for backend to start..."
                    sleep 10
                    curl -f http://localhost:3000/api/teachers || (echo "❌ Health check failed" && exit 1)
                    echo "✅ Backend is healthy."
                '''
            }
        }

    }

    post {
        success {
            echo "🚀 Deployment successful! EduPrime SMS is live."
        }
        failure {
            echo "❌ Pipeline failed. Check the logs above."
            // Roll back to previous containers if deploy failed
            sh 'docker-compose down || true'
        }
        always {
            // Clean up dangling images to save disk space
            sh 'docker image prune -f || true'
            echo "Pipeline finished — ${currentBuild.currentResult}"
        }
    }
}
