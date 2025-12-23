from ursina import *
from car import Car
from city_loader import CityLoader

# Initialize Ursina
app = Ursina(
    title='Open World City Explorer',
    vsync=True,
    fullscreen=True,
    borderless=True,
    development_mode=False
)

# Set window attributes for "No UI" experience
window.show_ursina_splash = False
window.fps_counter.enabled = False
window.exit_button.enabled = False # Press Alt+F4 to exit

# Sky
Sky(texture='sky_sunset')

# Lighting
DirectionalLight(y=2, z=3, shadows=True, rotation=(45, -45, 45))
AmbientLight(color=color.rgba(100, 100, 100, 0.1))

# Load City
city = CityLoader()

# Create Car
player_car = Car(position=(0, 2, 0))

# Camera setup (handled in car.py but we can tweak global settings)
camera.fov = 90

# Input handling for exiting
def input(key):
    if key == 'escape':
        application.quit()

# Start the game
if __name__ == '__main__':
    app.run()
