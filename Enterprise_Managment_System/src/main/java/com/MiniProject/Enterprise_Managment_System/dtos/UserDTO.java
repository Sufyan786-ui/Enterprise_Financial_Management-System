package com.MiniProject.Enterprise_Managment_System.dtos;

import java.time.LocalDate;
import lombok.Data;

@Data
public class UserDTO {
    private int user_id;
    private int department_id; // Maps to the Department entity's ID
    private String fullname;
    private String role;
    private String email;
    private String status;
    private LocalDate created_at;
}
