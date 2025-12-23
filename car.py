from ursina import *

class Car(Entity):
    def __init__(self, position=(0, 0, 0)):
        super().__init__(
            model='cube',
            color=color.red,
            scale=(2, 1, 4),
            position=position,
            collider='box'
        )
        self.speed = 0
        self.rotation_speed = 0
        self.max_speed = 30
        self.acceleration = 15 # Increased acceleration
        self.friction = 8 # Significantly increased friction for snappier stops
        self.turn_speed = 100
        
        # Simple wheels for visuals
        self.wheels = []
        wheel_positions = [
            (-1.1, -0.5, 1.5), (1.1, -0.5, 1.5),
            (-1.1, -0.5, -1.5), (1.1, -0.5, -1.5)
        ]
        for p in wheel_positions:
            w = Entity(parent=self, model='cube', scale=(0.4, 0.4, 0.8), position=p, color=color.black)
            self.wheels.append(w)

    def update(self):
        # Acceleration
        if held_keys['w'] or held_keys['up arrow']:
            self.speed += self.acceleration * time.dt
        elif held_keys['s'] or held_keys['down arrow']:
            self.speed -= self.acceleration * time.dt
        else:
            # Friction
            if self.speed > 0:
                self.speed -= self.friction * time.dt
                if self.speed < 0: self.speed = 0
            elif self.speed < 0:
                self.speed += self.friction * time.dt
                if self.speed > 0: self.speed = 0
                
        # Cap speed
        self.speed = clamp(self.speed, -self.max_speed / 2, self.max_speed)
        
        # Steering (only when moving)
        if abs(self.speed) > 0.1:
            turn_amount = self.turn_speed * time.dt
            if self.speed < 0: # Reverse steering
                turn_amount = -turn_amount
                
            if held_keys['a'] or held_keys['left arrow']:
                self.rotation_y -= turn_amount
            if held_keys['d'] or held_keys['right arrow']:
                self.rotation_y += turn_amount
                
        # Movement & Collision
        # Calculate proposed next position
        movement = self.forward * self.speed * time.dt
        
        # Simple Raycast for collision detection in front/back
        # Cast a ray from the center of the car in the direction of movement
        direction = self.forward if self.speed > 0 else self.back
        dist = abs(self.speed * time.dt) + 1.0 # Look ahead slightly
        
        # We need to ignore self (the car)
        hit_info = raycast(self.position, direction, distance=dist, ignore=(self,), debug=False)
        
        if hit_info.hit:
            # Collision! Stop the car.
            self.speed = 0
        else:
            # Safe to move
            self.position += movement
        
        # Camera follow
        camera.position = lerp(camera.position, self.position + (self.back * 15) + (self.up * 8), time.dt * 4)
        camera.look_at(self)
