// ====================================================================
// API MODULE - TAURI COMMANDS MATCHING V1 APIs
// ====================================================================
//
// This module provides Tauri commands that exactly match the
// Next.js V1 API routes, ensuring 100% frontend compatibility.
// ====================================================================

pub mod people;
pub mod companies;
pub mod actions;
pub mod speedrun;
pub mod chronicle;

// Re-export all commands
pub use people::*;
pub use companies::*;
pub use actions::*;
pub use speedrun::*;
pub use chronicle::*;
