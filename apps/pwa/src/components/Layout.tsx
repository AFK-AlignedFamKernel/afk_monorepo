'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { useAccount } from '@starknet-react/core';
import { NostrKeyManager, useAuth } from 'afk_nostr_sdk';
import { Icon } from './small/icon-component';
import { useRouter } from 'next/navigation';
import CryptoLoading from './small/crypto-loading';
import Image from 'next/image';
import { useUIStore } from '@/store/uiStore';
import RightBarDesktop from './RightBarDesktop';
import { ProfileManagement } from '@/components/profile/profile-management';
import { AvatarIcon } from './small/icons';
import MobileBottomBar from './MobileBottomBar';
import { logClickedEvent } from '@/lib/analytics';
import CreateAll from './Form/CreateAll';
import { ButtonPrimary } from './button/Buttons';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { showToast, showModal } = useUIStore()
  const [isLoading, setIsLoading] = useState(false);
  const router = typeof window === 'undefined' ? null : useRouter();

  const { address } = useAccount();

  const { publicKey, setAuth } = useAuth();
  useEffect(() => {
    if (address) {
      console.log('address', address);
    }
  }, [address]);


  useEffect(() => {
    if (typeof window === 'undefined') return;

    const readNostrStorage = () => {
      const nostrStorageStr = NostrKeyManager.getNostrWalletConnected()
      if (!nostrStorageStr) {
        return
      }
      const nostrStorage = JSON.parse(nostrStorageStr)
      if (nostrStorage && nostrStorage?.publicKey) {
        setAuth(nostrStorage?.publicKey, nostrStorage?.secretKey)
      }
    }
    if (!publicKey) {
      readNostrStorage()
    }
  }, [publicKey])

  // Close sidebar when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Now safe to use localStorage or document
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
    } else if (savedTheme === 'light') {
      setDarkMode(false);
      document.body.classList.remove('dark-mode');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
      if (prefersDark) {
        document.body.classList.add('dark-mode');
      }
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    if (newDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }

  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
      document.body.classList.add('page-transition');
    };

    const handleComplete = () => {
      setIsLoading(false);
      document.body.classList.remove('page-transition');
    };


    // router?.events?.on('routeChangeStart', handleStart);
    // router?.events?.on('routeChangeComplete', handleComplete);
    // router?.events?.on('routeChangeError', handleComplete);

    // return () => {
    //   router?.events?.off('routeChangeStart', handleStart);
    //   router?.events?.off('routeChangeComplete', handleComplete);
    //   router?.events?.off('routeChangeError', handleComplete);
    // };
  }, [router]);

  const handleCreateAll = () => {
    // if (url.includes('nostr')) {
    //   setIsLoading(true);
    //   document.body.classList.add('page-transition');
    // }
    showModal(<CreateAll />)
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  // Then use mounted state to guard browser API access
  useEffect(() => {
    if (!mounted) return;
    // Safe to use browser APIs here
  }, [mounted]);

  return (
    <div className="page">
      {/* Mobile Header */}
      <header className="mobile-header">


        <div className="mobile-header-logo">
          <Link href="/" onClick={() => {
            logClickedEvent("go_to_home_nav", "click", "link_drawer")
            // closeSidebar()
          }}>
            <Image
              src="/afk_logo_circle.png"
              alt="AFK Logo"
              width={50}
              height={50}
              unoptimized
            />
          </Link>
        </div>

        {/* <div className="flex items-center gap-4">

          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <svg className="theme-toggle__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 3V4M12 20V21M21 12H20M4 12H3M18.364 18.364L17.657 17.657M6.343 6.343L5.636 5.636M18.364 5.636L17.657 6.343M6.343 17.657L5.636 18.364M16 12C16 14.209 14.209 16 12 16C9.791 16 8 14.209 8 12C8 9.791 9.791 8 12 8C14.209 8 16 9.791 16 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg className="theme-toggle__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M21.752 15.002C20.915 15.7527 19.9638 16.3526 18.938 16.774C17.9123 17.1954 16.8305 17.4329 15.738 17.476C14.6456 17.5192 13.5513 17.3672 12.5 17.027C8.6 15.7 5.9 11.992 5.9 8.002C5.9 7.302 5.978 6.618 6.14 5.959C6.28224 5.39118 6.48413 4.83807 6.743 4.309C3.57 5.7 1.25 8.97 1.25 12.826C1.25 18.001 5.394 22.125 10.575 22.125C15.268 22.125 19.143 19.092 20.45 14.985C20.8874 14.3631 21.2663 13.703 21.582 13.013C21.6 13.02 21.671 14.192 21.752 15.002Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div> */}
        <div className="flex items-center gap-4">
          <button className="btn btn-blue" onClick={() => showModal(<ProfileManagement />)}>
            <AvatarIcon width={20} height={20} />
          </button>
          <button
            // className="sidebar-toggle"
            onClick={() => {
              toggleSidebar()
              logClickedEvent("toggle_sidebar", "click", "link_drawer")
            }}
            aria-label="Toggle navigation"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3 12H21M3 6H21M3 18H21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} `}>
        <div className="logo hidden md:block">
          <Link href="/" onClick={() => {
            logClickedEvent("go_to_home", "click", "link_drawer")
            closeSidebar()
          }}>
            <Image
              src="/afk_logo_circle.png"
              alt="AFK Logo"
              width={50}
              height={50}
              unoptimized

            />
          </Link>
        </div>

        <div className="sidebar-nav overflow-y-hidden scrollbar-hide ">
          <div className="sidebar-nav-header items-left align-start justify-left flex flex-wrap gap-4">
            <Link href="/" className="sidebar-nav-item" onClick={() => {
              logClickedEvent("go_to_home", "click", "link_drawer")
              closeSidebar()
            }}>
              <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 22V12H15V22"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Home
            </Link>

            <button
              className="sidebar-nav-item"
              onClick={() => {
                logClickedEvent("create", "click", "link_drawer")
                closeSidebar()
                handleCreateAll()
              }}>
              <Icon name="AddPostIcon" size={24} />
              Create</button>


            {/* <div className='sidebar-nav-item'>
              <AccordionMenu title="Nostr"
                items={[{
                  title: "Social Nostr",
                  icon: (<Icon name="SocialNostr" size={24}></Icon>),
                  content: (
                    <>
                      <Link href="/nostr/feed" className="sidebar-nav-item" onClick={() => {
                        logClickedEvent("nostr_feed", "click", "link_drawer")
                        closeSidebar()
                      }}>
                        <Icon name="FeedIcon" size={24} />

                        Feed
                      </Link>
                      <Link href="/nostr/my-profile" className="sidebar-nav-item" onClick={() => {
                        logClickedEvent("nostr_my_profile", "click", "link_drawer")
                        closeSidebar()
                      }}>
                        <Icon name="UserIcon" size={24}


                        />

                        My Profile
                      </Link>
                      <Link href="/nostr/login" className="sidebar-nav-item" onClick={() => {
                        logClickedEvent("nostr_login", "click", "link_drawer")
                        closeSidebar()
                      }}>
                        <Icon name="LoginIcon" size={24}
                        />
                        Login
                      </Link>
                    </>)
                },
                ]} />
            </div> */}

            <Link href="/discover" className="sidebar-nav-item" onClick={() => {
              logClickedEvent("go_to_discover", "click", "link_drawer")
              closeSidebar()
            }}>
              <Icon name="DiscoverIcon" size={24} />
              Discover
            </Link>
            {/* <Link href="/launchpad" className="sidebar-nav-item" onClick={() => {
              logClickedEvent("go_to_launchpad", "click", "link_drawer")
              closeSidebar()
            }}>
              <Icon name="UpwardTrendGraphIcon" size={24} />
              Launchpad
            </Link> */}

            {/* <Link href="/discover" className="sidebar-nav-item" onClick={() => {
              logClickedEvent("go_to_discover", "click", "link_drawer")
              closeSidebar()
            }}>
              <Icon name="DiscoverIcon" size={24} />
              Discover
            </Link> */}

            <Link href="/wallet" className="sidebar-nav-item" onClick={() => {
              logClickedEvent("go_to_wallet", "click", "link_drawer")
              closeSidebar()
            }}>
              <Icon name="WalletIcon" size={24} />
              Wallet
            </Link>

            <Link href="/profile" className="sidebar-nav-item" onClick={() => {
              logClickedEvent("go_to_profile", "click", "link_drawer")
              closeSidebar()
            }}>
              <Icon name="UserIcon" size={24} />
              Profile
            </Link>



            <div className='flex items-center gap-4'>


              <div className="flex items-center gap-4">

                <ButtonPrimary
                  onClick={() => {
                    showModal(<ProfileManagement />)
                    logClickedEvent("connect_modal_open", "click", "link_drawer")
                  }}
                >Connect</ButtonPrimary>
                {/* <button className="btn btn-gradient-green" onClick={() => {
                  showModal(<ProfileManagement />)
                  logClickedEvent("connect_modal_open", "click", "link_drawer")
                }}>
                  Connect
                </button> */}
              </div>
              <button
                className=" justify-end theme-toggle"
                onClick={() => {
                  toggleTheme()
                  logClickedEvent(`toggle_theme_${darkMode ? "dark" : "light"}`, "click", "link_drawer")
                }}
                aria-label="Toggle theme"
              >
                {darkMode ? (
                  <svg className="theme-toggle__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 3V4M12 20V21M21 12H20M4 12H3M18.364 18.364L17.657 17.657M6.343 6.343L5.636 5.636M18.364 5.636L17.657 6.343M6.343 17.657L5.636 18.364M16 12C16 14.209 14.209 16 12 16C9.791 16 8 14.209 8 12C8 9.791 9.791 8 12 8C14.209 8 16 9.791 16 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg className="theme-toggle__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M21.752 15.002C20.915 15.7527 19.9638 16.3526 18.938 16.774C17.9123 17.1954 16.8305 17.4329 15.738 17.476C14.6456 17.5192 13.5513 17.3672 12.5 17.027C8.6 15.7 5.9 11.992 5.9 8.002C5.9 7.302 5.978 6.618 6.14 5.959C6.28224 5.39118 6.48413 4.83807 6.743 4.309C3.57 5.7 1.25 8.97 1.25 12.826C1.25 18.001 5.394 22.125 10.575 22.125C15.268 22.125 19.143 19.092 20.45 14.985C20.8874 14.3631 21.2663 13.703 21.582 13.013C21.6 13.02 21.671 14.192 21.752 15.002Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>



            {/* <a href="/stream" className="sidebar-nav-item" onClick={closeSidebar}>
              <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect
                  x="2"
                  y="3"
                  width="20"
                  height="14"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="8"
                  y1="21"
                  x2="16"
                  y2="21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="12"
                  y1="17"
                  x2="12"
                  y2="21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Stream
            </a> */}
          </div>

          <div className="sidebar-nav-footer">


            <button
              className="sidebar-nav-footer-item"
              onClick={() => {
                toggleTheme()
                logClickedEvent(`toggle_theme_${darkMode ? "dark" : "light"}`, "click", "link_drawer")
              }}
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 3V4M12 20V21M21 12H20M4 12H3M18.364 18.364L17.657 17.657M6.343 6.343L5.636 5.636M18.364 5.636L17.657 6.343M6.343 17.657L5.636 18.364M16 12C16 14.209 14.209 16 12 16C9.791 16 8 14.209 8 12C8 9.791 9.791 8 12 8C14.209 8 16 9.791 16 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M21.752 15.002C20.915 15.7527 19.9638 16.3526 18.938 16.774C17.9123 17.1954 16.8305 17.4329 15.738 17.476C14.6456 17.5192 13.5513 17.3672 12.5 17.027C8.6 15.7 5.9 11.992 5.9 8.002C5.9 7.302 5.978 6.618 6.14 5.959C6.28224 5.39118 6.48413 4.83807 6.743 4.309C3.57 5.7 1.25 8.97 1.25 12.826C1.25 18.001 5.394 22.125 10.575 22.125C15.268 22.125 19.143 19.092 20.45 14.985C20.8874 14.3631 21.2663 13.703 21.582 13.013C21.6 13.02 21.671 14.192 21.752 15.002Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            <div className="sidebar-nav-copyright">
              AFK © {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      <div
        className={`overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      ></div>

      {/* Main Content */}
      <main
        className="main-content"
      >
        {isLoading && <CryptoLoading />}
        <div
          className="content pb-20 md:pb-0"
        >
          {children}
          <RightBarDesktop />

        </div>
      </main>

      <MobileBottomBar />

    </div>
  );
};

export default Layout; 