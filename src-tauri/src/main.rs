// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // FORCE PATH: Prepend the directory of the running executable to PATH
    // This ensures that 'mpv.exe' (bundled in the same folder) is found by the plugin.
    if let Ok(current_exe) = std::env::current_exe() {
        if let Some(exe_dir) = current_exe.parent() {
            let path_key = "PATH";
            if let Ok(current_path) = std::env::var(path_key) {
                let new_path = format!("{};{}", exe_dir.display(), current_path);
                std::env::set_var(path_key, new_path);
                println!("Debug: Added {:?} to PATH", exe_dir);
            }
        }
    }

    // Quick verification: Can we spawn mpv?
    match std::process::Command::new("mpv").arg("--version").output() {
        Ok(output) => println!(
            "Debug: Found mpv version: {}",
            String::from_utf8_lossy(&output.stdout)
        ),
        Err(e) => println!("Debug: Failed to find mpv in PATH: {}", e),
    }

    tauri_app_lib::run()
}
