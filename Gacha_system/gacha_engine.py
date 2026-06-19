import random

PITY_SOFT_START = 74

NAMED_STARS = [
    "Polaris", "Vega", "Sirius", "Rigel", "Antares", "Capella",
    "Altair", "Procyon", "Deneb", "Bellatrix", "Spica", "Arcturus",
]

STANDARD_CONSTELLATIONS = ["Ursa Major", "Cassiopeia", "Andromeda", "Cygnus"]
FEATURED_CONSTELLATION = "Orion"


def pity_chance(pulls_since_5star):
    if pulls_since_5star < PITY_SOFT_START:
        return 0.006
    return min(1, 0.006 + 0.0625 * (pulls_since_5star - PITY_SOFT_START))


class GachaState:
    def __init__(self):
        self.pulls_since_5star = 0
        self.total_pulls = 0
        self.five_star_count = 0
        self.four_star_count = 0
        self.guaranteed = False
        self.history = []

    def pull_once(self):
        self.total_pulls += 1
        self.pulls_since_5star += 1
        pulls = self.pulls_since_5star

        chance_5 = pity_chance(pulls)
        chance_4 = 1 if pulls % 10 == 0 else 0.1
        result = random.uniform(0, 1.0)

        entry = {"pull_number": self.total_pulls}

        if result < chance_5:
            self.five_star_count += 1
            if self.guaranteed:
                name, kind = FEATURED_CONSTELLATION, "limited"
                self.guaranteed = False
            else:
                if random.uniform(0, 1) < 0.5:
                    name, kind = FEATURED_CONSTELLATION, "limited"
                    self.guaranteed = False
                else:
                    name, kind = random.choice(STANDARD_CONSTELLATIONS), "standard"
                    self.guaranteed = True
            entry.update(rarity=5, name=name, kind=kind)
            self.pulls_since_5star = 0
        elif result < chance_4:
            self.four_star_count += 1
            entry.update(rarity=4, name=random.choice(NAMED_STARS), kind=None)
        else:
            entry.update(rarity=3, name=None, kind=None)

        self.history.insert(0, entry)
        return entry

    def pull_many(self, n):
        return [self.pull_once() for _ in range(n)]

    def to_dict(self):
        return {
            "pulls_since_5star": self.pulls_since_5star,
            "total_pulls": self.total_pulls,
            "five_star_count": self.five_star_count,
            "four_star_count": self.four_star_count,
            "guaranteed": self.guaranteed,
            "history": self.history[:50],
        }
