import fs from "node:fs";

import sql from "better-sqlite3";
import slugify from "slugify";
import xss from "xss";

const db = sql("meals.db");

export async function getMeals() {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // throw new Error("Simulated data fetching error");
    return db.prepare('SELECT * FROM meals').all();
}

export function getMeal(slug) {
    return db.prepare('SELECT * FROM meals WHERE slug = ?').get(slug);
}

export async function saveMeal(meal) {
    meal.slug = slugify(meal.title, { lower: true })
    meal.instructions = xss(meal.instructions);

    // Support two shapes for meal.image:
    // - a string path (already uploaded): '/images/abc.jpg'
    // - a File/Blob object from the client upload (has .name and .arrayBuffer)
    let extension;
    const isStringImage = typeof meal.image === 'string';
    if (isStringImage) {
        extension = meal.image.split('.').pop();
    } else if (meal.image && typeof meal.image.name === 'string') {
        extension = meal.image.name.split('.').pop();
    } else {
        // fallback if shape is unexpected
        extension = 'bin';
    }

    const fileName = `${meal.slug}.${extension}`

    const stream = fs.createWriteStream(`public/images/${fileName}`)
    const bufferedImage = await meal.image.arrayBuffer();

    stream.write(Buffer.from(bufferedImage), (error) => {
        if (error) {
            throw new Error("Storing image failed!");
        }
    });

    meal.image = `/images/${fileName}`
    db.prepare(`
        INSERT INTO meals 
            (slug, title, image, summary, instructions, creator, creator_email) 
        VALUES (
            @slug,
            @title,
            @image,
            @summary,
            @instructions,
            @creator,
            @creator_email
        )
    `).run(meal)
}