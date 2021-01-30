# Ray tracer

This Ray Tracer runs on the fragment shader. For it to work, you need to render a quad that covers the entirety of the view port so that every fragment is processed.

It works by doing the inverse of what light would do.
For every pixel in the screen, a ray is sent out. If the ray hits an object, another ray is cast towards the light source.

The shapes it currently supports are cubes, cylinders and spheres.
It has shadows, and you can move around in it.

I plan on adding a floor and reflection.


![](https://imgur.com/yVu3X2A)
