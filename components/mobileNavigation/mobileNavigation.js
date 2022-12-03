import { Link, List, ListItem } from '@material-ui/core'
import React from 'react'

function MobileNavigation() {
    const navigationLinks =[
        {
            name: "Swap",
            href: "/swap"
        },
        {
            name: "Pools",
            href: "/liquidity"
        },
        {
            name: "Vest",
            href: "/vest"
        },
        {
            name: "Vote",
            href:"/vote"
        },
        {
            name: "Rewards",
            href: "/rewards"
        },
        {
            name: "Bribe",
            href: "/bribe"
        }
    ]
  return (
    <List>
        {navigationLinks.map((item) => (
            <ListItem>
                <Link
                    color='textPrimary'
                    variant='button'
                    underline='none'
                    href={item.href}
                >
                    {item.name}
                </Link>
            </ListItem>
        ))}
    </List>
  )
}

export default MobileNavigation