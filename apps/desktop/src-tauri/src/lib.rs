// Tauri v2 应用入口（lib）
// 所有业务逻辑放在 lib，bin 仅调用 lib::run()
// 这样便于后续移动端复用同一套逻辑

use std::sync::Once;

static LOG_INIT: Once = Once::new();

/// 初始化日志系统（进程内只执行一次）
fn init_logger() {
    LOG_INIT.call_once(|| {
        env_logger::Builder::from_env(
            env_logger::Env::default().default_filter_or("info"),
        )
        .format_timestamp_millis()
        .init();
    });
}

/// 示例 command：从前端接收名称并返回问候
#[tauri::command]
fn greet(name: &str) -> String {
    log::info!("[cmd::greet] 收到前端调用, name=\"{}\"", name);

    if name.is_empty() {
        log::warn!("[cmd::greet] name 为空，使用默认值");
        return "Hello, stranger! You've been greeted from Rust!".to_string();
    }

    let result = format!("Hello, {}! You've been greeted from Rust!", name);
    log::info!("[cmd::greet] 返回结果: {}", result);
    result
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_logger();

    log::info!("========================================================");
    log::info!("[aikitr-desktop] 应用启动中...");
    log::info!("[aikitr-desktop] 版本: {}", env!("CARGO_PKG_VERSION"));
    log::info!("[aikitr-desktop] 平台: {}", std::env::consts::OS);
    log::info!("[aikitr-desktop] 架构: {}", std::env::consts::ARCH);
    log::info!("========================================================");

    log::info!("[run] 正在构建 Tauri Builder...");
    let builder = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet]);

    log::info!("[run] Tauri Builder 构建完成，注册的 commands: [greet]");
    log::info!("[run] 正在启动 Tauri 应用事件循环...");

    match builder.run(tauri::generate_context!()) {
        Ok(()) => {
            log::info!("[run] Tauri 应用正常退出");
        }
        Err(e) => {
            log::error!("[run] Tauri 应用启动失败: {}", e);
            std::process::exit(1);
        }
    }
}
