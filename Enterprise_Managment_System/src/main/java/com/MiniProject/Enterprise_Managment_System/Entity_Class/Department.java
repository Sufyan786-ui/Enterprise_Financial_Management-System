package com.MiniProject.Enterprise_Managment_System.Entity_Class;

import java.time.LocalDate;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.GenerationType;
import lombok.Data;

@Data
@Entity
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int department_id;
    private String department_name;
    private String description;
    private LocalDate created;
}
