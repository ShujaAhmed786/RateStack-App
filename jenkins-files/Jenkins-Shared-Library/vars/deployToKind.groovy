def call(Map config = [:]) {
    def clusterName    = config.get('clusterName', 'ratestack-cluster')
    def deploymentName = config.get('deploymentName', 'ratestack-deployment')
    def namespace      = config.get('namespace', 'default')
    def imageName      = config.get('imageName', "shujaahmed198/ratestack-app:${env.BUILD_NUMBER}")

    stage('Deploy to Kind') {
        sh "kind load docker-image ${imageName} --name ${clusterName}"

        sh """
            kubectl set image deployment/${deploymentName} \
              ratestack-app=${imageName} \
              -n ${namespace}
            
            kubectl rollout status deployment/${deploymentName} -n ${namespace} --timeout=120s
        """
    }
}
