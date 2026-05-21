package com.MiniProject.Enterprise_Managment_System.Admin;

import org.springframework.data.jpa.repository.JpaRepository;

import com.MiniProject.Enterprise_Managment_System.Entity_Class.User_Class;

public interface Repository extends JpaRepository<User_Class, Integer> {

}
