package com.MiniProject.Enterprise_Managment_System.dtos;

import java.time.LocalDate;
import lombok.Data;

@Data
public class DepartmentDTO {
    private int department_id;
    private String department_name;
    private String description;
    private LocalDate created;
}
