import {
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarToggle,
  NavbarLink,
  Button,
} from 'flowbite-react';
import { Link } from 'react-router-dom';

import { SendHorizontal, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { links } from '../assets/links';

export default function Component() {
  const { theme, appName, toggleTheme } = useApp();

  return (
    <Navbar className="sticky z-5 shadow-md flex  top-0">
      <NavbarBrand href="#">
        <SendHorizontal className="size-10 mr-5 stroke-primary" />
        <span className="self-center text-primary  whitespace-nowrap text-2xl font-semibold ">
          {appName}
        </span>
      </NavbarBrand>
      <div className="flex md:order-2  gap-4 items-center justify-end">
        <Button onClick={toggleTheme} className="btn-primary">
          {theme === 'dark' ? (
            <Moon className="dark:stroke-white stroke-3" />
          ) : (
            <Sun className="dark:stroke-white stroke-3" />
          )}
        </Button>
        <NavbarToggle />
      </div>
      <NavbarCollapse>
        {links.map((link) => (
          <Link
            className="block py-2 pl-3 pr-4 md:p-0 border-b border-gray-100 text-gray-700 hover:bg-gray-50 md:border-0 md:hover:bg-transparent md:hover:text-primary-700 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent md:dark:hover:text-white dark:text-white"
            key={link.id}
            to={`/${link.id === 'home' ? '#' : link.id}`}
          >
            {link.text}
          </Link>
        ))}
      </NavbarCollapse>
    </Navbar>
  );
}
