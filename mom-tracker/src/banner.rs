pub fn print_installation_banner() {
    let c1 = "\x1b[38;5;196m"; // Red
    let c2 = "\x1b[38;5;208m"; // Orange
    let c3 = "\x1b[38;5;220m"; // Yellow
    let c4 = "\x1b[38;5;82m";  // Green
    let c5 = "\x1b[38;5;45m";  // Cyan
    let c6 = "\x1b[38;5;135m"; // Purple
    let c7 = "\x1b[38;5;201m"; // Magenta
    let reset = "\x1b[0m";
    let bold_green = "\x1b[1;38;5;82m";
    let bold_white = "\x1b[1;37m";

    let line1 = format!("  __  __{} _____ _  _{}    ___  _____ {}  __  __ {}  _  _____ {}___ _____  {}", c1, c2, c3, c4, c5, c6);
    let line2 = format!(" |  \\/  {}| ____| \\| |{}  / _ \\|  ___|{} |  \\/  |{} / \\|_   _|{} _ \\_ _\\ \\/ /{}", c1, c2, c3, c4, c5, c6);
    let line3 = format!(" | |\\/| {}|  _| | .` |{} | | | | |_   {} | |\\/| |{}/ _ \\ | | {}|   /| | \\  / {}", c1, c2, c3, c4, c5, c6);
    let line4 = format!(" | |  | {}| |___| |\\  |{} | |_| |  _|  {} | |  | {}/ ___ \\| | {}| |\\_\\| | /  \\{}", c1, c2, c3, c4, c5, c6);
    let line5 = format!(" |_|  |_{}_____|_| \\_|{}  \\___/|_|    {} |_|  |_{}/_/   \\_\\_| {}|_| \\___/_/\\_\\{}", c1, c2, c3, c4, c5, c7);

    println!("\n{}", line1);
    println!("{}", line2);
    println!("{}", line3);
    println!("{}", line4);
    println!("{}", line5);
    println!("                                                                {}....is now installed!{}\n", bold_green, reset);

    println!("{}Before you start tracking:{}", bold_white, reset);
    println!("  • Run {}mom-tracker login{} to log in and start tracking your usage.", bold_green, reset);
    println!("  • Check your stats anytime with {}mom-tracker stats{}.", bold_green, reset);
    println!("  • View background daemon status using {}mom-tracker status{}.\n", bold_green, reset);
}
