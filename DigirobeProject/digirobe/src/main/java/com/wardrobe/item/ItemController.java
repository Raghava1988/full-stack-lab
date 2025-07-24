package com.wardrobe.item;

import com.wardrobe.user.User;
import com.wardrobe.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.transaction.annotation.Transactional; // <-- IMPORT THIS
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;

    public ItemController(ItemRepository itemRepository, UserRepository userRepository) {
        this.itemRepository = itemRepository;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentPrincipalName = authentication.getName();
        return userRepository.findByEmail(currentPrincipalName)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @GetMapping
    @Transactional(readOnly = true) // Add this annotation
    public List<ItemDTO> getAllItemsForUser() {
        User user = getAuthenticatedUser();
        return itemRepository.findByUserId(user.getId()).stream()
                .map(ItemDTO::new)
                .collect(Collectors.toList());
    }

    @PostMapping
    @Transactional // Add this annotation
    public ItemDTO createItem(@RequestBody Item item) {
        User user = getAuthenticatedUser();
        item.setUser(user);
        Item savedItem = itemRepository.save(item);
        return new ItemDTO(savedItem);
    }
    
    @PutMapping("/{id}")
    @Transactional // Add this annotation
    public ResponseEntity<ItemDTO> updateItem(@PathVariable(value = "id") Long itemId, @RequestBody Item itemDetails) {
        User user = getAuthenticatedUser();
        Optional<Item> optionalItem = itemRepository.findById(itemId);

        if (optionalItem.isPresent()) {
            Item item = optionalItem.get();
            if (!item.getUser().getId().equals(user.getId())) {
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }
            item.setName(itemDetails.getName());
            item.setBrand(itemDetails.getBrand());
            item.setPrice(itemDetails.getPrice());
            item.setCategory(itemDetails.getCategory());
            item.setSubCategory(itemDetails.getSubCategory());
            item.setItemSize(itemDetails.getItemSize());
            item.setImageUrl(itemDetails.getImageUrl());
            item.setInLaundry(itemDetails.isInLaundry());
            
            final Item updatedItem = itemRepository.save(item);
            return ResponseEntity.ok(new ItemDTO(updatedItem));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @Transactional // Add this annotation
    public ResponseEntity<Void> deleteItem(@PathVariable(value = "id") Long itemId) {
        User user = getAuthenticatedUser();
        Optional<Item> optionalItem = itemRepository.findById(itemId);

        if (optionalItem.isPresent()) {
            Item item = optionalItem.get();
            if (!item.getUser().getId().equals(user.getId())) {
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }
            itemRepository.delete(item);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}