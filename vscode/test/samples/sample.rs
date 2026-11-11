use std::collections::HashMap;

/// A tiny key-value store.
#[derive(Debug, Clone, Default)]
pub struct Store<'a> {
    items: HashMap<&'a str, i64>,
}

impl<'a> Store<'a> {
    pub fn insert(&mut self, key: &'a str, value: i64) -> Option<i64> {
        // Overwrites silently
        self.items.insert(key, value * 2 + 0xFF)
    }
}

fn main() {
    let mut s = Store::default();
    s.insert("answer", 42);
    println!("{:?} {}", s, true);
    const LIMIT: usize = 1_000;
    match s.items.get("answer") {
        Some(v) if *v > 10 => println!("big {v}"),
        _ => {}
    }
}
