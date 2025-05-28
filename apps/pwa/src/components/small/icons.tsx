import { PropsWithChildren, forwardRef, Ref } from "react";
import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

type IconComponent = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;

export const ConsoleIcon: IconComponent = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      fill="currentColor"
      d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H4V5h16v14z"
    />
    <path fill="currentColor" d="M6 7h5v5H6zm7 0h5v5h-5zm-7 7h5v3H6zm7 0h5v3h-5z" />
  </svg>
));

export const CreateIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
      fill="currentColor"
    />
  </svg>
);


export const AddPostIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" fill="none" {...props} className="icon">
    <path
      fill="currentColor"
      d="M30 3.464a12 12 0 0 1 12 0l19.177 11.072a12 12 0 0 1 6 10.392v22.144a12 12 0 0 1-6 10.392L42 68.536a12 12 0 0 1-12 0L10.823 57.464a12 12 0 0 1-6-10.392V24.928a12 12 0 0 1 6-10.392L30 3.464Z"
    />
    <path
      fill="#fff"
      fillRule="evenodd"
      d="M36 23.667c.92 0 1.667.746 1.667 1.666v9h9a1.667 1.667 0 1 1 0 3.334h-9v9a1.667 1.667 0 1 1-3.334 0v-9h-9a1.667 1.667 0 1 1 0-3.334h9v-9c0-.92.746-1.666 1.667-1.666Z"
      clipRule="evenodd"
    />
  </svg>
);

export const LoginIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 17l-5-5 5-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 12H3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export const AdminIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
      fill="currentColor"
    />
  </svg>
);

export const EditIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M3 17.25V21h3.75l12.452-12.452-3.75-3.75L3 17.25zM22.707 7.293a1.004 1.004 0 00-.293-.707l-3.75-3.75a1.004 1.004 0 00-.707-.293 1.004 1.004 0 00-.707.293l-2.5 2.5 4.457 4.457 2.5-2.5a1.004 1.004 0 00.293-.707z"
      fill="currentColor"
    />
  </svg>
);

export const CrownIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    {...props}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);

export const TrashIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6l-2 14H7L5 6h14z" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 3h6a2 2 0 0 1 2 2H7a2 2 0 0 1 2-2z" />
  </svg>
);

export const RemoveIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    {...props}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export const CheckIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor" />
  </svg>
);

export const BackIcon: IconComponent = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <path
      d="M20 12H4M10 18L4 12L10 6"
      // {...props}
      strokeWidth={2}
      strokeLinejoin="round"
    />
  </svg>
));

export const MoreIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
      fill="currentColor"
    />
    <path
      d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z"
      fill="currentColor"
    />
    <path
      d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z"
      fill="currentColor"
    />
  </svg>
);

export const GameIcon: IconComponent = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      {...props}
      fill="none"
      viewBox="0 0 32 32"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 16 3 C 14.55 3 13.336007 3.5797556 12.552734 4.4609375 C 11.769462 5.3421194 11.400391 6.4773872 11.400391 7.5996094 C 11.400391 8.7218315 11.769462 9.8590529 12.552734 10.740234 C 12.684189 10.888121 12.845202 11.013079 13 11.142578 L 13 11.632812 L 2.4023438 15.722656 C 1.5531496 16.050203 1.0301181 16.859848 1.0019531 17.664062 C 1.0011783 17.686188 1.0097926 17.708288 1.0097656 17.730469 L 1 17.730469 L 1 22.152344 C 1 22.772954 1.3647211 23.338196 1.921875 23.599609 L 11.005859 27.882812 C 14.164346 29.372377 17.835654 29.372377 20.994141 27.882812 L 30.082031 23.597656 C 30.633469 23.336312 31 22.772954 31 22.152344 L 31 17.732422 L 30.990234 17.732422 C 30.990226 17.709596 30.998844 17.68683 30.998047 17.664062 C 30.969877 16.859848 30.44685 16.050203 29.597656 15.722656 L 19 11.632812 L 19 11.142578 C 19.154798 11.013079 19.315811 10.888121 19.447266 10.740234 C 20.230538 9.8590529 20.599609 8.7218315 20.599609 7.5996094 C 20.599609 6.4773872 20.230538 5.3421194 19.447266 4.4609375 C 18.663993 3.5797556 17.45 3 16 3 z M 16 5 C 16.949999 5 17.536398 5.3202444 17.953125 5.7890625 C 18.369852 6.2578806 18.599609 6.9218315 18.599609 7.5996094 C 18.599609 8.2773872 18.369852 8.9413383 17.953125 9.4101562 C 17.536398 9.8789744 16.949999 10.199219 16 10.199219 C 15.050001 10.199219 14.463602 9.8789744 14.046875 9.4101562 C 13.630148 8.9413382 13.400391 8.2773872 13.400391 7.5996094 C 13.400391 6.9218315 13.630148 6.2578806 14.046875 5.7890625 C 14.463602 5.3202444 15.050001 5 16 5 z M 15 12.101562 C 15.318018 12.164288 15.652124 12.199219 16 12.199219 C 16.347876 12.199219 16.681982 12.164288 17 12.101562 L 17 17.548828 C 17 18.113858 16.56503 18.548828 16 18.548828 C 15.43497 18.548828 15 18.113858 15 17.548828 L 15 12.101562 z M 13 13.777344 L 13 17.548828 C 13 19.193798 14.35503 20.548828 16 20.548828 C 17.64497 20.548828 19 19.193798 19 17.548828 L 19 13.777344 L 28.878906 17.587891 C 29.008074 17.637709 28.99826 17.674197 29 17.732422 C 29.000022 17.73316 28.999974 17.733629 29 17.734375 C 29.0021 17.793905 29.01757 17.826805 28.892578 17.884766 L 19.537109 22.222656 C 17.304967 23.257064 14.693875 23.256941 12.462891 22.222656 L 3.109375 17.884766 C 2.9843856 17.826805 2.997915 17.793909 3 17.734375 C 3.0000519 17.732896 2.9999605 17.73192 3 17.730469 C 3.0015514 17.673511 2.9954893 17.637091 3.1230469 17.587891 L 13 13.777344 z M 8 17 A 2 1 0 0 0 8 19 A 2 1 0 0 0 8 17 z M 3 20.039062 L 11.623047 24.037109 C 14.392063 25.320825 17.609049 25.320702 20.378906 24.037109 L 29 20.039062 L 29 21.896484 L 20.140625 26.074219 C 17.523111 27.308656 14.476889 27.308656 11.859375 26.074219 L 3 21.896484 L 3 20.039062 z"
      ></path>
    </svg>
  );
});


export const RepostIcon: IconComponent = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
  return (
    <svg
      ref={ref}
      width="17"
      height="17"
      viewBox="0 0 17 17"
      fill="none"
      {...props}
    >
      <path
        d="M0.482422 16.6713V14.6263H3.29434L2.88534 14.2684C1.99915 13.4845 1.37712 12.5898 1.01924 11.5843C0.661362 10.5788 0.482422 9.56481 0.482422 8.54229C0.482422 6.65064 1.04907 4.96774 2.18236 3.49362C3.31564 2.01949 4.79403 1.04384 6.61752 0.566664V2.71395C5.3905 3.15704 4.40207 3.91114 3.65222 4.97627C2.90238 6.04139 2.52745 7.23006 2.52745 8.54229C2.52745 9.30918 2.67231 10.0548 2.96202 10.779C3.25174 11.5033 3.70335 12.1722 4.31686 12.7857L4.57249 13.0414V10.5362H6.61752V16.6713H0.482422ZM10.7076 16.4157V14.2684C11.9346 13.8253 12.923 13.0712 13.6729 12.0061C14.4227 10.9409 14.7976 9.75227 14.7976 8.44004C14.7976 7.67315 14.6528 6.92757 14.3631 6.20329C14.0734 5.479 13.6218 4.81011 13.0082 4.1966L12.7526 3.94097V6.44613H10.7076V0.311035H16.8427V2.35607H14.0308L14.4398 2.71395C15.2748 3.549 15.8841 4.45649 16.2675 5.4364C16.651 6.41631 16.8427 7.41752 16.8427 8.44004C16.8427 10.3317 16.276 12.0146 15.1427 13.4887C14.0095 14.9628 12.5311 15.9385 10.7076 16.4157Z"
        fill="currentColor"
      />
    </svg>
  );
});


export const LikeIcon: IconComponent = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
  return (
    <svg
      ref={ref}
      viewBox="0 0 22 20"
      fill="none"
      {...props}
    >
      <path
        d="M10.8551 20.0084L9.28673 18.6023C7.46604 16.9618 5.96082 15.5468 4.77106 14.357C3.5813 13.1672 2.6349 12.0992 1.93186 11.1528C1.22882 10.2064 0.737595 9.33657 0.458182 8.5434C0.178769 7.75023 0.0390625 6.93903 0.0390625 6.1098C0.0390625 4.4153 0.606902 3.00021 1.74258 1.86453C2.87826 0.72885 4.29335 0.161011 5.98786 0.161011C6.92524 0.161011 7.81756 0.359304 8.66481 0.75589C9.51207 1.15248 10.2421 1.7113 10.8551 2.43237C11.468 1.7113 12.198 1.15248 13.0453 0.75589C13.8925 0.359304 14.7849 0.161011 15.7222 0.161011C17.4167 0.161011 18.8318 0.72885 19.9675 1.86453C21.1032 3.00021 21.671 4.4153 21.671 6.1098C21.671 6.93903 21.5313 7.75023 21.2519 8.5434C20.9725 9.33657 20.4813 10.2064 19.7782 11.1528C19.0752 12.0992 18.1288 13.1672 16.939 14.357C15.7493 15.5468 14.2441 16.9618 12.4234 18.6023L10.8551 20.0084ZM10.8551 17.088C12.5856 15.5377 14.0097 14.2083 15.1274 13.0996C16.245 11.991 17.1283 11.0266 17.7773 10.2064C18.4262 9.38615 18.8769 8.65607 19.1293 8.01612C19.3817 7.37618 19.5078 6.74074 19.5078 6.1098C19.5078 5.02821 19.1473 4.12687 18.4262 3.40581C17.7052 2.68474 16.8038 2.32421 15.7222 2.32421C14.875 2.32421 14.0908 2.56306 13.3698 3.04077C12.6487 3.51847 12.153 4.12687 11.8826 4.86597H9.82753C9.55713 4.12687 9.0614 3.51847 8.34033 3.04077C7.61927 2.56306 6.83511 2.32421 5.98786 2.32421C4.90626 2.32421 4.00493 2.68474 3.28386 3.40581C2.56279 4.12687 2.20226 5.02821 2.20226 6.1098C2.20226 6.74074 2.32845 7.37618 2.58082 8.01612C2.83319 8.65607 3.28386 9.38615 3.93282 10.2064C4.58178 11.0266 5.46508 11.991 6.58274 13.0996C7.70039 14.2083 9.12449 15.5377 10.8551 17.088Z"
        fill="currentColor"
        strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      />
    </svg>
  );
});

export const CommentIcon: IconComponent = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
  return (
    <svg
      ref={ref}
      width="21"
      height="21"
      viewBox="0 0 21 21"
      fill="none"
      {...props}
    >
      <path
        d="M20.798 20.7163L16.7079 16.6263H6.48275C5.92037 16.6263 5.43893 16.426 5.03845 16.0255C4.63796 15.625 4.43772 15.1436 4.43772 14.5812V13.5587H15.6854C16.2478 13.5587 16.7292 13.3585 17.1297 12.958C17.5302 12.5575 17.7304 12.0761 17.7304 11.5137V4.35606H18.7529C19.3153 4.35606 19.7968 4.5563 20.1973 4.95678C20.5977 5.35727 20.798 5.8387 20.798 6.40109V20.7163ZM2.39269 10.6701L3.59415 9.46864H13.6404V2.31102H2.39269V10.6701ZM0.347656 15.6037V2.31102C0.347656 1.74864 0.547899 1.2672 0.948385 0.866719C1.34887 0.466234 1.8303 0.265991 2.39269 0.265991H13.6404C14.2028 0.265991 14.6842 0.466234 15.0847 0.866719C15.4852 1.2672 15.6854 1.74864 15.6854 2.31102V9.46864C15.6854 10.031 15.4852 10.5125 15.0847 10.9129C14.6842 11.3134 14.2028 11.5137 13.6404 11.5137H4.43772L0.347656 15.6037Z"
        fill="currentColor"
      />
    </svg>
  );
});

export const GiftIcon: IconComponent = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
  return (
    <svg
      ref={ref}
      width="21"
      height="20"
      viewBox="0 0 21 20"
      fill="none"
      {...props}
    >
      <path
        d="M2.43855 15.3809V17.3371H18.0876V15.3809H2.43855ZM2.43855 4.62222H4.59029C4.50879 4.47551 4.45581 4.32065 4.43136 4.15764C4.40691 3.99463 4.39468 3.82347 4.39468 3.64415C4.39468 2.8291 4.67995 2.13631 5.25049 1.56577C5.82102 0.99523 6.51382 0.709961 7.32887 0.709961C7.81791 0.709961 8.27026 0.836294 8.68594 1.08896C9.10162 1.34163 9.46431 1.65542 9.77403 2.03035L10.2631 2.66609L10.7521 2.03035C11.0455 1.63912 11.4041 1.32125 11.828 1.07674C12.2518 0.832219 12.7082 0.709961 13.1973 0.709961C14.0123 0.709961 14.7051 0.99523 15.2756 1.56577C15.8462 2.13631 16.1315 2.8291 16.1315 3.64415C16.1315 3.82347 16.1192 3.99463 16.0948 4.15764C16.0703 4.32065 16.0173 4.47551 15.9358 4.62222H18.0876C18.6255 4.62222 19.086 4.81376 19.4691 5.19683C19.8522 5.57991 20.0437 6.04041 20.0437 6.57835V17.3371C20.0437 17.875 19.8522 18.3355 19.4691 18.7186C19.086 19.1017 18.6255 19.2932 18.0876 19.2932H2.43855C1.90062 19.2932 1.44011 19.1017 1.05703 18.7186C0.67396 18.3355 0.482422 17.875 0.482422 17.3371V6.57835C0.482422 6.04041 0.67396 5.57991 1.05703 5.19683C1.44011 4.81376 1.90062 4.62222 2.43855 4.62222ZM2.43855 12.4467H18.0876V6.57835H13.0995L15.1534 9.36583L13.5885 10.4906L10.2631 5.99151L6.93765 10.4906L5.37274 9.36583L7.37778 6.57835H2.43855V12.4467ZM7.32887 4.62222C7.60599 4.62222 7.83828 4.52849 8.02574 4.34103C8.21321 4.15356 8.30694 3.92127 8.30694 3.64415C8.30694 3.36704 8.21321 3.13475 8.02574 2.94728C7.83828 2.75982 7.60599 2.66609 7.32887 2.66609C7.05176 2.66609 6.81947 2.75982 6.632 2.94728C6.44454 3.13475 6.35081 3.36704 6.35081 3.64415C6.35081 3.92127 6.44454 4.15356 6.632 4.34103C6.81947 4.52849 7.05176 4.62222 7.32887 4.62222ZM13.1973 4.62222C13.4744 4.62222 13.7067 4.52849 13.8941 4.34103C14.0816 4.15356 14.1753 3.92127 14.1753 3.64415C14.1753 3.36704 14.0816 3.13475 13.8941 2.94728C13.7067 2.75982 13.4744 2.66609 13.1973 2.66609C12.9201 2.66609 12.6879 2.75982 12.5004 2.94728C12.3129 3.13475 12.2192 3.36704 12.2192 3.64415C12.2192 3.92127 12.3129 4.15356 12.5004 4.34103C12.6879 4.52849 12.9201 4.62222 13.1973 4.62222Z"
        fill="currentColor"
      />
    </svg>
  );
});

export const RocketIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z"
      fill="currentColor"
    />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const RocketIconV2: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M13.13 1.15c-.19-.25-.48-.4-.8-.4-.32 0-.61.15-.8.4L8.87 5.2c-.08.11-.13.24-.13.38v3.4L4.06 16.8c-.27.55-.13 1.21.33 1.6.46.39 1.12.39 1.58 0l2.91-2.39c.32-.26.75-.35 1.15-.23l3.69 1.09c.61.18 1.26-.06 1.57-.6l3.32-5.73c.31-.54.23-1.21-.18-1.65l-5.3-5.74zM10.6 12.83l-1.91 1.57c-.2.16-.5.03-.5-.22V9.65l2.41 3.18z"
      fill="currentColor"
    />
    <path
      d="M5 21c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-1H5v1z"
      fill="currentColor"
    />
  </svg>
);

export const HandshakeIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M15.2 10.7l1.4-1.4c.6-.6 1.5-.6 2.1 0l2.8 2.8c.6.6.6 1.5 0 2.1l-4.2 4.2c-.6.6-1.5.6-2.1 0l-2.8-2.8M8.8 13.3l-1.4 1.4c-.6.6-1.5.6-2.1 0L2.5 11.9c-.6-.6-.6-1.5 0-2.1l4.2-4.2c.6-.6 1.5-.6 2.1 0l2.8 2.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 14.5l5-5"
      fill="none" 
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const LaunchpadIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M12.5 2.5c-.83 0-1.5.67-1.5 1.5v5.15l-1.65 3.35L4 16.5V21h16v-4.5l-5.35-4-1.65-3.35V4c0-.83-.67-1.5-1.5-1.5zM11 14h2v3h-2v-3zm-3 4h8v1H8v-1z"
      fill="currentColor"
    />
    <path
      d="M12.5 1L8 3.5l1 2L12.5 4l3.5 1.5 1-2z"
      fill="currentColor"
    />
  </svg>
);

export const ConversationIconBubble: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white mb-3" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
  </svg>
)
export const ChevronDown: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"
      fill="currentColor"
    />
  </svg>
);

export const FeedIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H3V6h18v12z"
      fill="currentColor"
    />
    <path
      d="M6 10h12v2H6zm0-3h12v2H6zm0 6h8v2H6z"
      fill="currentColor"
    />
  </svg>
);

export const UserPlusIcon: IconComponent = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <path
      d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm13 11v-3h-2v3h-3v2h3v3h2v-3h3v-2z"
      fill="currentColor"
    />
  </svg>
));

export const SocialNostr: IconComponent = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4-8c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4 4zm2 2c.55 0 1.05-.14 1.5-.39v2.79c-.45.25-.95.39-1.5.39s-1.05-.14-1.5-.39v-2.79c.45.25.95.39 1.5.39z"
      fill="currentColor"
    />
  </svg>
));


export const WalletIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 32 32" fill="none" {...props}>
    <path
      d="M4 8C4 6.34315 5.34315 5 7 5H25C26.6569 5 28 6.34315 28 8V24C28 25.6569 26.6569 27 25 27H7C5.34315 27 4 25.6569 4 24V8Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M22 16C22 15.4477 22.4477 15 23 15H25C25.5523 15 26 15.4477 26 16V18C26 18.5523 25.5523 19 25 19H23C22.4477 19 22 18.5523 22 18V16Z"
      fill="currentColor"
    />
  </svg>

);

export const SettingsIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SendIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ReceiveIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M12 4V20M12 20L18 14M12 20L6 14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ScanIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M7 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V7M17 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V7M7 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V17M17 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V17M9 7H15M9 12H15M9 17H15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CloseIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);


export const HomeIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M9.524 1.996c.836-.47 1.61-.746 2.476-.746.866 0 1.64.277 2.476.746.81.454 1.738 1.125 2.905 1.97l1.51 1.09c.936.677 1.684 1.218 2.248 1.719.582.517 1.018 1.032 1.295 1.68.277.65.344 1.315.307 2.083-.036.74-.174 1.635-.345 2.75l-.315 2.05c-.244 1.585-.437 2.846-.722 3.828-.294 1.016-.71 1.823-1.45 2.44-.739.613-1.618.887-2.692 1.017-1.045.127-2.363.127-4.028.127H10.81c-1.665 0-2.983 0-4.028-.127-1.074-.13-1.953-.404-2.692-1.018-.74-.616-1.156-1.423-1.45-2.439-.285-.982-.478-2.244-.722-3.827l-.315-2.052c-.171-1.114-.309-2.008-.345-2.749-.037-.768.03-1.433.307-2.083.277-.648.713-1.163 1.295-1.68.564-.5 1.312-1.042 2.249-1.719l1.509-1.09c1.167-.845 2.095-1.516 2.905-1.97ZM10 17a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-4Z"
      clipRule="evenodd"
    />
  </svg>
);

export const IndicatorIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 6 6" fill="none" {...props}>
    <rect width={6} height={6} fill="currentColor" rx={3} />
  </svg>
);

export const MessageIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M8.98368 18.8571C8.4529 18.7286 7.92497 18.5621 7.37131 18.3685L3.79112 19.9492C3.78341 19.9526 3.7752 19.9456 3.77743 19.9375L4.69206 16.617C3.4357 15.3458 2.00622 13.8115 2.00622 10.3996C1.82328 5.4028 7.24655 1.74833 11.1012 2.01194C11.9954 2.01212 12.9963 2.25396 13.8395 2.45769L13.8735 2.4659C15.1064 2.8253 17.1562 3.99932 18.3692 5.68609C19.3875 7.10215 19.7414 8.54366 19.8281 9.0031"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M21.5829 18.1216C22.9036 15.2437 20.8918 12.001 18.1313 11.2207C15.5118 10.3421 12.1405 11.8825 11.2565 14.5C10.3724 17.1175 11.7078 20.3461 14.8531 21.1618C16.4741 21.7055 17.7451 21.3271 18.1736 21.1616C18.8539 21.3751 20.3554 21.6856 20.8648 21.9975C20.9744 22.0645 20.7937 21.2464 20.6428 19.517C20.9028 19.0975 21.4739 18.6987 21.5829 18.1216Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

export const NotificationIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M2.52992 14.394C2.31727 15.7471 3.268 16.6862 4.43205 17.1542C8.89481 18.9486 15.1052 18.9486 19.5679 17.1542C20.732 16.6862 21.6827 15.7471 21.4701 14.394C21.3394 13.5625 20.6932 12.8701 20.2144 12.194C19.5873 11.2975 19.525 10.3197 19.5249 9.27941C19.5249 5.2591 16.1559 2 12 2C7.84413 2 4.47513 5.2591 4.47513 9.27941C4.47503 10.3197 4.41272 11.2975 3.78561 12.194C3.30684 12.8701 2.66061 13.5625 2.52992 14.394Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 21C9.79613 21.6219 10.8475 22 12 22C13.1525 22 14.2039 21.6219 15 21"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SearchIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M16.7771 15.3629C17.5518 15.1066 18.4392 15.2866 19.0555 15.9029L22.0971 18.9445C22.9676 19.8151 22.9676 21.2265 22.0971 22.0971C21.2265 22.9676 19.8151 22.9676 18.9445 22.0971L15.9029 19.0555C15.2866 18.4392 15.1066 17.5518 15.3629 16.7771L13.293 14.7072L14.7072 13.293L16.7771 15.3629Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1 9C1 4.58172 4.58172 1 9 1C13.4183 1 17 4.58172 17 9C17 13.4183 13.4183 17 9 17C4.58172 17 1 13.4183 1 9ZM9 3C5.68629 3 3 5.68629 3 9C3 12.3137 5.68629 15 9 15C12.3137 15 15 12.3137 15 9C15 5.68629 12.3137 3 9 3Z"
      fill="currentColor"
    />
  </svg>
);

export const AFKIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 16" fill="none" {...props}>
    <path
      fill="currentColor"
      d="m0 0h205l6 3 2 4v120l-4 5-2 1-132 1v38l136 1 2 3v127l-4 3-133 1-1 68-2 5-6 5h-139l-6-4-2-4v-285l3-6 4-3 64-1 1-76 5-5z"
    />
  </svg>
);

export const UserIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" {...props}>
    <path
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 29.333c7.364 0 13.333-5.97 13.333-13.333 0-7.364-5.97-13.333-13.333-13.333C8.636 2.667 2.667 8.637 2.667 16c0 7.364 5.97 13.333 13.333 13.333Z"
    />
    <path
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 22.667c3.109-3.257 8.858-3.41 12 0m-2.673-10A3.336 3.336 0 0 1 15.989 16a3.336 3.336 0 0 1-3.338-3.333 3.336 3.336 0 0 1 3.338-3.334 3.336 3.336 0 0 1 3.338 3.334Z"
    />
  </svg>
);

export const CopyIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="m16.596 20.699-2.445.647c-2.263.6-3.395.899-4.281.408-.887-.49-1.182-1.58-1.773-3.758l-1.462-5.391c-.59-2.179-.886-3.268-.367-4.13.52-.863 1.651-1.163 3.914-1.762l4-1.06c2.264-.598 3.395-.898 4.282-.407.886.49 1.182 1.58 1.772 3.758l1.468 5.413c.251.926.377 1.39.239 1.825m-5.347 4.457c.752-.2.758-.202 1.343-.704l2.743-2.355c.749-.642 1.123-.963 1.261-1.398m-5.347 4.457s.588-4.593 1.904-5.199c1.493-.687 3.443.742 3.443.742"
      />
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        d="M17 5.001c-.064-1.073-.243-1.749-.752-2.233-.78-.742-2.03-.746-4.532-.754l-4.423-.013c-2.502-.007-3.753-.01-4.528.727-.775.737-.771 1.928-.764 4.31l.018 5.893c.008 2.381.011 3.572.79 4.314.78.742 2.031.746 4.533.753l.681.002"
      />
    </svg>
  );
};

export const GlobeIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const PadlockIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    {...props}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const SlantedArrowIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    {...props}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 17L17 7M7 7h10v10" />
  </svg>
);

export const MenuIcons: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M3 12H21M3 6H21M3 18H21"
      // {...props}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const GalleryIcon: IconComponent = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        d="M2.5 12c0-4.478 0-6.718 1.391-8.109S7.521 2.5 12 2.5c4.478 0 6.718 0 8.109 1.391S21.5 7.521 21.5 12c0 4.478 0 6.718-1.391 8.109C18.717 21.5 16.479 21.5 12 21.5c-4.478 0-6.718 0-8.109-1.391C2.5 18.717 2.5 16.479 2.5 12Z"
      />
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        d="M16.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
      />
      <path
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M16 22c-.62-2.225-2.066-4.218-4.123-5.666-2.22-1.561-5.005-2.387-7.861-2.331-.34-.001-.678.01-1.016.032"
      />
      <path
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13 18c1.701-1.327 3.535-2.007 5.386-2a7.792 7.792 0 0 1 3.114.662"
      />
    </svg>
  );
});

export const LightningIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);


export const ShareIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M18 8L22 12L18 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


export const AvatarIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor" />
  </svg>
);



export const RefreshIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (  
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M23 4v6h-6M1 20v-6h6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);


export const ExternalLinkIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4l2 2-2 2M18 18H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


export const TransactionIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 7l5-5 5 5M7 17l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SwapIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 22V2M2 12H22M17 12l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);