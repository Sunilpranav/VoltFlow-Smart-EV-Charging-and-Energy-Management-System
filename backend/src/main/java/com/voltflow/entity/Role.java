package com.voltflow.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true, length = 50)
    private String name;

    @JsonIgnore
    @ManyToMany(mappedBy = "roles")
    private Set<User> users = new HashSet<>();

    public Role() {
    }

    public Role(Long id, String name, Set<User> users) {
        this.id = id;
        this.name = name;
        this.users = users != null ? users : new HashSet<>();
    }

    public static RoleBuilder builder() {
        return new RoleBuilder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Set<User> getUsers() {
        return users;
    }

    public void setUsers(Set<User> users) {
        this.users = users;
    }

    public static class RoleBuilder {
        private Long id;
        private String name;
        private Set<User> users = new HashSet<>();

        RoleBuilder() {
        }

        public RoleBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public RoleBuilder name(String name) {
            this.name = name;
            return this;
        }

        public RoleBuilder users(Set<User> users) {
            this.users = users;
            return this;
        }

        public Role build() {
            return new Role(id, name, users);
        }

        @Override
        public String toString() {
            return "Role.RoleBuilder(id=" + this.id + ", name=" + this.name + ", users=" + this.users + ")";
        }
    }
}
