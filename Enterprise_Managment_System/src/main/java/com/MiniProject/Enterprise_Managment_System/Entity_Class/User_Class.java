package com.MiniProject.Enterprise_Managment_System.Entity_Class;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;

@Data
@Entity
public class User_Class {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int user_id;
    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;
    private String fullname;
    private String role;
    private String email;
    private String status;
    private LocalDate created_at;
}
