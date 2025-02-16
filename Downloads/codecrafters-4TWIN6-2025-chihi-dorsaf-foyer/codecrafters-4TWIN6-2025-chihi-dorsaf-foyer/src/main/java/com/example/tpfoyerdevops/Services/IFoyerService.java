package com.example.tpfoyerdevops.Services;


import com.example.tpfoyerdevops.Entities.Foyer;

import java.util.List;

public interface IFoyerService {
    Foyer addOrUpdate(Foyer f);

    List<Foyer> findAll();

    Foyer findById(long id);

    void deleteById(long id);

    void delete(Foyer f);







}
