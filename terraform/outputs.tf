output "users_table_name" {
  value = aws_dynamodb_table.users.name
}
output "teachers_table_name" {
  value = aws_dynamodb_table.teachers.name
}
output "students_table_name" {
  value = aws_dynamodb_table.students.name
}
output "join_requests_table_name" {
  value = aws_dynamodb_table.join_requests.name
}
output "marks_table_name" {
  value = aws_dynamodb_table.marks.name
}
output "attendance_table_name" {
  value = aws_dynamodb_table.attendance.name
}
output "announcements_table_name" {
  value = aws_dynamodb_table.announcements.name
}
output "fees_table_name" {
  value = aws_dynamodb_table.fees.name
}
