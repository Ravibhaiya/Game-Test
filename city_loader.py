from ursina import *
import city_data

class CityLoader(Entity):
    def __init__(self):
        super().__init__()
        self.load_city()

    def load_city(self):
        print("Loading city...")
        # To optimize, we can use a parent entity or merge meshes if performance is bad.
        # But for simplicity and to match the "data driven" approach, we iterate.
        # We will only instantiate objects that are buildings or parks.
        # Roads can be a flat plane or individual tiles.
        
        # Ground plane
        ground = Entity(model='plane', scale=(1000, 1, 1000), color=color.rgb(50, 50, 50), collider='box')
        
        count = 0
        
        # Create a parent for buildings to keep hierarchy clean
        self.buildings_parent = Entity(name='buildings_root')
        
        # We'll use a simple texture or color for optimization
        # Reusing the same model is key for Ursina/Panda3D performance
        
        for item in city_data.city_layout:
            x = item['x']
            z = item['z']
            type = item['type']
            
            if type == 'building':
                # Create building
                e = Entity(
                    parent=self.buildings_parent,
                    model='cube',
                    position=(x, item['height'] / 2, z),
                    scale=(item['width'], item['height'], item['depth']),
                    color=color.hex(item['color']),
                    collider='box'
                )
                count += 1
            elif type == 'park':
                # Create park area (green flat cube)
                e = Entity(
                    parent=self.buildings_parent,
                    model='cube',
                    position=(x, 0.1, z),
                    scale=(item['width'], 0.2, item['depth']),
                    color=color.green,
                    collider=None
                )
                count += 1
            # Roads are implicitly the ground color for now, or we can add markers
            # If we added road entities for every road cell, it might lag more.
            # But the user asked for "explore full city", so visual cues help.
            elif type == 'road':
                 e = Entity(
                    parent=self.buildings_parent,
                    model='plane',
                    position=(x, 0.05, z),
                    scale=(item['width'], 1, item['depth']),
                    color=color.dark_gray,
                    collider=None
                )
            
        print(f"City loaded with {count} structures.")

