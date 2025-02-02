package com.example.tpfoyerdevops.Entities;


import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.OneToOne;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.experimental.FieldDefaults;

import javax.persistence.Entity;
import javax.persistence.Id;
import java.io.Serializable;
import java.util.ArrayList;


@Entity
@Table(name = "T_FOYER")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Foyer implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    long idFoyer;
    String nomFoyer;
    long capaciteFoyer;
    @OneToOne(mappedBy = "foyer")
    Universite universite;
    @OneToMany(mappedBy = "foyer")
    List<Bloc> blocs= new ArrayList<>();
}
