package com.MiniProject.Enterprise_Managment_System.Admin;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.MiniProject.Enterprise_Managment_System.Entity_Class.Department;

public interface DepartmentRepository extends JpaRepository<Department, Integer> {
    
    @Query("SELECT d FROM Department d WHERE d.department_name = :name")
    List<Department> findByName(@Param("name") String name);
}
