package com.MiniProject.Enterprise_Managment_System.dtos;

import java.time.LocalDate;
import lombok.Data;

@Data
public class UserDTO {
    private int user_id;
    private String department_name; // Accepts name from frontend
    private String fullname;
    private String role;
    private String email;
    private String status;
    private LocalDate created_at;
}
