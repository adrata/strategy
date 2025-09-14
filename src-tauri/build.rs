use std::env;
use std::path::Path;

fn main() {
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let project_dir = Path::new(&manifest_dir).parent().unwrap();

    // Prioritize .env.production, then fall back to .env (now in env/ folder)
    let prod_env_path = project_dir.join("env/.env.production");
    let dev_env_path = project_dir.join("env/.env.development.local");

    let mut env_loaded = false;
    if prod_env_path.exists() {
        dotenvy::from_path(prod_env_path.as_path()).expect("Failed to load .env.production file");
        println!("cargo:rerun-if-changed={}", prod_env_path.display());
        println!("✅ build.rs: Loaded environment variables from env/.env.production.");
        env_loaded = true;
    } else if dev_env_path.exists() {
        dotenvy::from_path(dev_env_path.as_path()).expect("Failed to load .env.development.local file");
        println!("cargo:rerun-if-changed={}", dev_env_path.display());
        println!("✅ build.rs: Loaded environment variables from env/.env.development.local file.");
        env_loaded = true;
    }

    if !env_loaded {
        println!("⚠️ build.rs: Neither env/.env.production nor env/.env.development.local found. Relying on system environment variables.");
    }

    // Pass the DATABASE_URL to the main application code - with desktop fallback
    match env::var("DATABASE_URL") {
        Ok(database_url) => {
            println!("cargo:rustc-env=DATABASE_URL={}", database_url);
            println!("✅ build.rs: Successfully embedded DATABASE_URL into the application.");
        }
        Err(_) => {
            // Set hardcoded production database for desktop builds
            let desktop_db_url = "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";
            println!("cargo:rustc-env=DATABASE_URL={}", desktop_db_url);
            println!("🔧 build.rs: Using hardcoded desktop DATABASE_URL for Tauri build.");
        }
    }

    tauri_build::build();
}
