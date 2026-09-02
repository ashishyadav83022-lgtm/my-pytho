$rand = Get-Random -Maximum 99999

Write-Host "1. Registering Trainer..." -ForegroundColor Cyan
$body1 = @{ name = "Trainer"; email = "trainer_$rand@example.com"; password = "123456"; role = "trainer" } | ConvertTo-Json
$trainer = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -ContentType "application/json" -Body $body1

Write-Host "2. Creating Course..." -ForegroundColor Cyan
$body2 = @{ title = "Test Course"; description = "Checking"; category = "Test" } | ConvertTo-Json
$course = Invoke-RestMethod -Uri "http://localhost:5000/api/courses" -Method Post -Headers @{ Authorization = "Bearer $($trainer.data.token)" } -ContentType "application/json" -Body $body2

Write-Host "3. Registering Trainee..." -ForegroundColor Cyan
$body3 = @{ name = "Trainee"; email = "trainee_$rand@example.com"; password = "123456"; role = "trainee" } | ConvertTo-Json
$trainee = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -ContentType "application/json" -Body $body3

Write-Host "4. Enrolling Trainee into Course..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "http://localhost:5000/api/enrollments/courses/$($course.data.id)" -Method Post -Headers @{ Authorization = "Bearer $($trainee.data.token)" }

Write-Host "5. Fetching My Enrollments..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "http://localhost:5000/api/enrollments/my-courses" -Method Get -Headers @{ Authorization = "Bearer $($trainee.data.token)" }