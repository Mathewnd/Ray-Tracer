#version 330 core

/// DON'T CHANGE

#define SCREEN_WIDHT 300
#define SCREEN_HEIGHT 200
#define ASPECT_RATIO 1.5 // 300 / 200 = 3 / 2 = 1.5
#define M_PI 3.14159265359

// variables

#define NUM_REFLECTANCES 1 // the maximum amount of reflectance
#define RAY_MAX_STEPS 250 // how many steps per loop
#define STEP_SIZE 0.1 // the size of each step
#define SKY_COLOUR vec3(0.5,0.5,0.8) //the colour of the sky
#define FOG_INCREASE 0.00375 // fog density
#define BRIGHTNESS_DECREASE 0.03 // how much each step inside an object reduces the brightness
#define MAX_FOG 1 // maximum distortion by fog
#define MIN_FOG 0 // minimum distortion by fog
#define LIGHT_POS vec3(0, 50, 50) // it will be normalized later, so use this as an overall direction.
#define NUMBER_SPHERES 2 //number of spheres   ( REMEMBER TO ALWAYS PROPERLY SET THE SHAPES, OTHERWISE IT WILL LIKELY CRASH THE APPLICATION.)
#define NUMBER_CUBES   0 //number of cubes     ( REMEMBER TO ALWAYS PROPERLY SET THE SHAPES, OTHERWISE IT WILL LIKELY CRASH THE APPLICATION.)
#define NUMBER_CYLIN   1 //number of cylinders ( REMEMBER TO ALWAYS PROPERLY SET THE SHAPES, OTHERWISE IT WILL LIKELY CRASH THE APPLICATION.)
#define MIN_REFLECTANCE 0.1 // minimum reflectance needed for something to reflect.
#define MIN_BRIGHTNESS 0.2 // minimum amount of brightness a ray can have
#define STARTING_BRIGHTNESS 0.9 // the initial amount of brightness in a ray

uniform vec3 time;

out vec4 color;

in mat4 c_perspective;
in mat4 c_view;
in vec3 c_pos;

struct Ray{
    vec3 origin;
    vec3 direction;
};

struct Sphere{
    vec3 position;
    float radius;
    vec3 colour;
    float reflectance;
};

struct Cube{
    vec3 p1;
    vec3 p2; // p2 ALWAYS has to be bigger than p1
    vec3 colour;
    float reflectance;
};

struct Cylinder{
    vec3 position;
    vec2 limits; // x = radius y = height
    vec3 colour;
    float reflectance;
};

bool insideSphere(vec3 p, Sphere sphere){
    return distance(p, sphere.position) <= sphere.radius;
}

bool insideCube(vec3 p, Cube c){
    return (p.x > c.p1.x) && (p.y > c.p1.y) && (p.z > c.p1.z) && (p.x < c.p2.x) && (p.y < c.p2.y) && (p.z < c.p2.z);
}

bool insideCylinder(vec3 p, Cylinder c){

    return distance(p.xz, c.position.xz) <= c.limits.x && distance(p.y, c.position.y) <= c.limits.y;

}



#if NUMBER_CUBES > 0
    Cube cube[] = Cube[NUMBER_CUBES](
        Cube(vec3(-1, -1, -1), vec3(1, 1, 1), vec3(1,0,0), 0.4)
    );
#endif // NUMBER_CUBES

#if NUMBER_SPHERES > 0
    Sphere sphere[] = Sphere[NUMBER_SPHERES](
        Sphere(vec3(0,10,-2.5), 4.f, vec3(0,1,0), 0.6),
        Sphere(vec3(0,4, 11), 4.f, vec3(0,1,0), 0.6)
    );
#endif // NUMBER_SPHERES

#if NUMBER_CYLIN > 0
    Cylinder cylinder[] = Cylinder[NUMBER_CYLIN](
        Cylinder(vec3(0, 6, 0), vec2(3, 4), vec3(0.3, 0.7, 0.7), 0.f)
    );
#endif // NUMBER_CYLIN

void collisions(in vec3 p, out float refl, out vec3 rdir, out vec3 c, out vec3 fhit, out bool hit){



}

void main(){

    //find the direction of the ray
    vec4 rayDirection;
    {float Px = (2 * ((gl_FragCoord.x + 0.5) / SCREEN_WIDHT) - 1) * tan(90 / 2 * M_PI / 180) * 1.5;
    float Py = 1 - 2 * ((gl_FragCoord.y + 0.5) / SCREEN_HEIGHT) * tan(90 / 2 * M_PI / 180);
    rayDirection = normalize(inverse(c_view) * vec4(Px, -Py, -1, 1) - inverse(c_view) * vec4(0, 0, 0, 1));}

    //initialize the ray

    Ray r;

    r.origin = c_pos;
    r.direction = rayDirection.xyz;

    //initialize the shapes

    // cast the ray till it either finds an object or passes the max number of steps

    vec3 finalColour = vec3(0,0,0);

    bool shouldReflect = false;
    bool hit = false;
    float fog = 0;

    vec3 p;

    for(int i = 0; (!hit) && i < RAY_MAX_STEPS; ++i){
        // increase the fog
        fog += FOG_INCREASE;

        //get the current ray position

        p = i * r.direction * STEP_SIZE + r.origin;


        //loop through every shape in the scene and check if colliding


        for(int j = 0; j < NUMBER_SPHERES; ++j){
            if(insideSphere(p, sphere[j])){
                finalColour = sphere[j].colour;
                if(sphere[j].reflectance >= MIN_REFLECTANCE) shouldReflect = true;
                hit = true;
            }
        }

        if(hit) break;
        #if NUMBER_CYLIN > 0
        for(int j = 0; j < NUMBER_CYLIN; ++j){
            if(insideCylinder(p, cylinder[j])){
                finalColour = cylinder[j].colour;
                if(cylinder[j].reflectance >= MIN_REFLECTANCE) shouldReflect = true;
                hit = true;
            }
        }

        if(hit) break;
        #endif
        #if NUMBER_CUBES > 0
        for(int j = 0; j < NUMBER_CUBES; ++j){
            if(insideCube(p, cube[j])){
                finalColour = cube[j].colour;
                if(cube[j].reflectance >= MIN_REFLECTANCE) shouldReflect = true;
                hit = true;
            }
        }
        if(hit) break;
        #endif // NUMBER_CUBES

    }

    //set up the ray to do the lighting check

    r.origin = p;
    r.direction = normalize(-(r.origin - LIGHT_POS));

    // do the lighting check

    float brightness = 1;

    if(hit){
        for(int i = 0; i < distance(r.origin, LIGHT_POS) / STEP_SIZE && i < RAY_MAX_STEPS; ++i){

            //get the current ray position

            vec3 p = (i+10) * r.direction * STEP_SIZE + r.origin;

            //loop through every shape and check if inside it

            for(int j = 0; j < NUMBER_SPHERES; ++j){
                if(insideSphere(p, sphere[j])){
                    //if inside decrease brightness
                    brightness = brightness - BRIGHTNESS_DECREASE;
                }
            }

            if(brightness <= MIN_BRIGHTNESS)
                break;
            #if NUMBER_CYLIN > 0
            for(int j = 0; j < NUMBER_CYLIN; ++j){
                if(insideCylinder(p, cylinder[j])){
                    //if inside decrease brightness
                    brightness = brightness - BRIGHTNESS_DECREASE;
                }
            }
            if(brightness <= MIN_BRIGHTNESS)
                break;
            #endif
            #if NUMBER_CUBES > 0
            for(int j = 0; j < NUMBER_CUBES; ++j){
                if(insideCube(p, cube[j])){
                    //if inside decrease brightness
                    brightness = brightness - BRIGHTNESS_DECREASE;
                }
            }
            if(brightness <= MIN_BRIGHTNESS)
                break;
            #endif // NUMBER_CUBES

        }
    }
    else
        finalColour = SKY_COLOUR;



    //set the output colour

    color = vec4(mix(finalColour * brightness, SKY_COLOUR, fog), 1);

}
