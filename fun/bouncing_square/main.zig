const std = @import("std");

export const width: u32 = 800;
export const height: u32 = 600;

export var image: [4*width*height]u8 = undefined;
var color: [3]u8 = undefined;

export fn setColor(r: u8, g: u8, b: u8) void {
    color[0] = r;
    color[1] = g;
    color[2] = b;
}

export fn init() void {
    for (0..height*width) |i| {
        image[4*i+3] = 255;
    }
}

export fn fill() void {
    for (0..height*width) |i| {
        image[4*i+0] = color[0];
        image[4*i+1] = color[1];
        image[4*i+2] = color[2];
    }
}

export fn square(x: usize, y: usize, w: usize, h: usize) void {
    for (y..y+h) |yi| {
        for (x..x+w) |xi| {
            const i = xi + yi * width;

            image[4*i+0] = color[0];
            image[4*i+1] = color[1];
            image[4*i+2] = color[2];
        }
    }
}
