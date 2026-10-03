def call(Map config = [:]) {
    def target   = config.get('target', 'package.json')
    def toolName = config.get('toolName', 'DP-Check')

    stage('OWASP Dependency-Check') {
        script {
            // Locate the configured tool path inside Jenkins
            def odcHome = tool(name: toolName, type: 'dependency-check')
            
            // Execute dependency-check directly via shell so exit codes/thresholds are fully controlled
            sh """
                ${odcHome}/bin/dependency-check.sh \
                  --scan ${target} \
                  --format HTML \
                  --format XML \
                  --out ./dependency-check-report \
                  --disableNodeAudit false \
                  --enableExperimental || true
            """

            // Archive the generated HTML report for download without setting the build status to FAILURE
            archiveArtifacts artifacts: 'dependency-check-report/**', allowEmptyArchive: true
        }
    }
}
