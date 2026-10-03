def call(Map config = [:]) {
    def serverName  = config.get('serverName', 'SonarQube')
    def scannerName = config.get('scannerName', 'Sonar')
    def projectKey  = config.get('projectKey', 'ratestack')
    def sources     = config.get('sources', '.')

    stage('SonarQube SAST Analysis') {
        withSonarQubeEnv(serverName) {
            def scannerHome = tool name: scannerName, type: 'hudson.plugins.sonar.SonarRunnerInstallation'
            sh """
                "${scannerHome}/bin/sonar-scanner" \
                  -Dsonar.projectKey=${projectKey} \
                  -Dsonar.sources=${sources} \
                  -Dsonar.exclusions="**/node_modules/**,**/.next/**"
            """
        }
    }
}
