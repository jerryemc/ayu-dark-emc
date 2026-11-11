#include <stdio.h>
#define SQUARE(x) ((x) * (x))

typedef struct {
    int id;
    const char *name;
} item_t;

static int total = 0; /* running total */

int add_item(item_t *item, double weight) {
    if (item == NULL || weight < 0.5) {
        return -1;
    }
    total += SQUARE(item->id);
    printf("%s: %d\n", item->name, total);
    return 0;
}
