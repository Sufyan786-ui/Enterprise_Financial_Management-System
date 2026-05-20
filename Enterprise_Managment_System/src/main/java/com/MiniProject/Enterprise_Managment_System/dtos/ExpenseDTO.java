package com.MiniProject.Enterprise_Managment_System.dtos;

import java.time.LocalDate;
import lombok.Data;

@Data
public class ExpenseDTO {
    private int expense_id;
    private int user_id;       // Maps to the User entity's ID
    private int department_id; // Maps to the Department entity's ID
    private String title;
    private LocalDate expense_date;
    private String status;
    private LocalDate created_at;
}
