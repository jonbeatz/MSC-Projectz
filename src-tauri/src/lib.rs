use std::process::Command;

#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
  if path.trim().is_empty() || path.contains(['\r', '\n']) {
    return Err("Invalid folder path".to_string());
  }

  #[cfg(target_os = "windows")]
  let status = Command::new("explorer")
    .arg(path)
    .status()
    .map_err(|err| err.to_string())?;

  #[cfg(target_os = "macos")]
  let status = Command::new("open")
    .arg(path)
    .status()
    .map_err(|err| err.to_string())?;

  #[cfg(all(unix, not(target_os = "macos")))]
  let status = Command::new("xdg-open")
    .arg(path)
    .status()
    .map_err(|err| err.to_string())?;

  if status.success() {
    Ok(())
  } else {
    Err(format!("Folder opener exited with status: {status}"))
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![open_folder])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
