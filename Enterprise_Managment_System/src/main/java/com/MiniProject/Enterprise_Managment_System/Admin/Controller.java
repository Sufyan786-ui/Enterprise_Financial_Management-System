package com.MiniProject.Enterprise_Managment_System.Admin;

import java.time.LocalDate;
import java.util.List;
// import org.hibernate.mapping.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.MiniProject.Enterprise_Managment_System.Entity_Class.Department;
import com.MiniProject.Enterprise_Managment_System.Entity_Class.User_Class;
import com.MiniProject.Enterprise_Managment_System.dtos.DepartmentDTO;
import com.MiniProject.Enterprise_Managment_System.dtos.UserDTO;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/admin")
@CrossOrigin("*")
public class Controller {
    @Autowired
    private Repository repo;
    @Autowired
    private DepartmentRepository deptRepo;

    @PostMapping("/add")
    public ResponseEntity<String> addUser(@RequestBody UserDTO userdto) {
        User_Class user = new User_Class();

        List<Department> depts = deptRepo.findByName(userdto.getDepartment_name());
        Department d = (depts != null && !depts.isEmpty()) ? depts.get(0) : null;

        // 2. If it doesn't exist yet, we can create it automatically!
        if (d == null) {
            d = new Department();
            d.setDepartment_name(userdto.getDepartment_name());
            d.setCreated(LocalDate.now());
            d = deptRepo.save(d); // Save it to get an ID
        }

        user.setDepartment(d);
        user.setEmail(userdto.getEmail());
        user.setFullname(userdto.getFullname()); // Fixed this!
        user.setCreated_at(LocalDate.now());
        user.setRole(userdto.getRole());
        user.setStatus("Active");
        repo.save(user);

        return ResponseEntity.ok("User added successfully");
    }

    @PostMapping("/add/dept")
    public ResponseEntity<String> addDepartment(@RequestBody DepartmentDTO depart) {
        Department dep = new Department();
        dep.setCreated(LocalDate.now());
        dep.setDepartment_name(depart.getDepartment_name());
        dep.setDescription(depart.getDescription());
        deptRepo.save(dep);
        return ResponseEntity.ok("Department is addes Succesfully");
    }
    // getting the api for admin;

    @GetMapping("/users")
    public ResponseEntity<List<User_Class>> fetch_user() {
        List<User_Class> user = repo.findAll();
        return ResponseEntity.ok(user);
    }

    @GetMapping("/depts")
    public ResponseEntity<List<Department>> fetch_dept() {
        List<Department> user = deptRepo.findAll();
        return ResponseEntity.ok(user);
    }

    // delete the user
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> delete_user(@PathVariable int id) {
        repo.deleteById(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    @DeleteMapping("/delete/dept/{id}")
    public ResponseEntity<String> delete_dept(@PathVariable int id) {
        deptRepo.deleteById(id);
        return ResponseEntity.ok("Department deleted successfully");
    }

}
