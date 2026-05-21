package com.MiniProject.Enterprise_Managment_System.Admin;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.MiniProject.Enterprise_Managment_System.Entity_Class.User_Class;

public interface Repository extends JpaRepository<User_Class, Integer> {

    boolean existsByEmail(String string);

    @Query(value = "select * from user_class order by created_at desc limit 5", nativeQuery = true)
    List<User_Class> find();

}
