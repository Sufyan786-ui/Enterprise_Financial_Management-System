package com.MiniProject.Enterprise_Managment_System.Entity_Class;

import java.time.LocalDate;

import org.hibernate.annotations.ManyToAny;

import jakarta.annotation.Generated;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;

@Data
@Entity
public class Expense {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int expense_id;
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User_Class user;
    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;
    private String title;
    private LocalDate expense_date;
    private String status;
    private LocalDate created_at;
}
