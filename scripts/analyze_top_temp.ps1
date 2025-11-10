$csvPath = "final_top - Sheet1.csv"
$companies = @{}
$people = 0
$companyOnlyEntries = 0

$content = Import-Csv -Path $csvPath

foreach ($row in $content) {
    $name = $row.Name.Trim()
    $company = $row.Company.Trim()
    
    if ($company) {
        if (-not $companies.ContainsKey($company)) {
            $companies[$company] = $true
        }
    }
    
    if ($name -and $company) {
        if ($name -eq $company) {
            $companyOnlyEntries++
        } else {
            # Check if name looks like a person (doesn't contain company keywords)
            $companyKeywords = @('inc', 'co', 'corp', 'llc', 'association', 'company', 'district', 
                                'authority', 'cooperative', 'power', 'electric', 'utility', 
                                'administration', 'council', 'agency', 'corporation')
            $nameLower = $name.ToLower()
            $isCompanyName = $false
            foreach ($keyword in $companyKeywords) {
                if ($nameLower -like "*$keyword*") {
                    $isCompanyName = $true
                    break
                }
            }
            if (-not $isCompanyName) {
                $people++
            }
        }
    }
}

Write-Host "Total unique companies: $($companies.Count)"
Write-Host "Total people: $people"
Write-Host "Company-only entries (no people): $companyOnlyEntries"
Write-Host ""
Write-Host "Total rows (excluding header): $($content.Count)"

