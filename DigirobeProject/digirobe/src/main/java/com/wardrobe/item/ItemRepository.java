package com.wardrobe.item;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    // JpaRepository<EntityType, PrimaryKeyType>
    // We get findAll(), findById(), save(), deleteById() etc. automatically.

    // We can also define custom queries, for example:
    List<Item> findByCategory(String category);
    List<Item> findByUserId(Long userId);
}