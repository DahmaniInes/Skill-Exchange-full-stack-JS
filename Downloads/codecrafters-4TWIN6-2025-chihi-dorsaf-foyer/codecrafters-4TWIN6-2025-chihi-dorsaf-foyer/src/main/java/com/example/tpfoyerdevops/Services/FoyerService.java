package com.example.tpfoyerdevops.Services;

import com.example.tpfoyerdevops.Entities.Foyer;
import com.example.tpfoyerdevops.Repositories.FoyerRepository;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import java.util.List;


@Service
public class FoyerService implements IFoyerService {
    private final FoyerRepository repo;

    @Autowired // Injection automatique du repo
    public FoyerService(FoyerRepository repo) {
        this.repo = repo;
    }

    @Override
    public Foyer addOrUpdate(Foyer f) {
        return repo.save(f);
    }

    @Override
    public List<Foyer> findAll() {
        return repo.findAll();
    }

    @Override
    public Foyer findById(long id) {
        return repo.findById(id).orElse(null);
    }

    @Override
    public void deleteById(long id) {
        repo.deleteById(id);
    }

    @Override
    public void delete(Foyer f) {
        repo.delete(f);
    }
}





